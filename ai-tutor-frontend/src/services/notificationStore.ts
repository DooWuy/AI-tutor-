import type { Notification, NotificationFeed } from '../types/notification';
import { isNotification } from './notificationValidation';

export interface NotificationGateway {
  feed(options: { cursor?: string; size?: number }, signal: AbortSignal): Promise<NotificationFeed>;
  count(signal: AbortSignal): Promise<number>;
  read(id: string, signal: AbortSignal): Promise<void>;
  readAll(signal: AbortSignal): Promise<void>;
}
export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  nextCursor: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  isMarkingAll: boolean;
  pendingReadIds: string[];
  error: string | null;
}
const initial = (): NotificationState => ({ notifications: [], unreadCount: 0, nextCursor: null,
  isLoading: true, isLoadingMore: false, isMarkingAll: false, pendingReadIds: [], error: null });
const message = (error: unknown) => error instanceof Error ? error.message : 'Không thể tải thông báo. Vui lòng thử lại.';

/** One instance per account; request epochs and confirmed reads survive REST/STOMP races. */
export class NotificationStore {
  private state = initial();
  private listeners = new Set<() => void>();
  private requests = new Set<AbortController>();
  private head: AbortController | null = null;
  private more: AbortController | null = null;
  private disposed = false;
  private lifecycle = 0;
  private headVersion = 0;
  private revision = 0;
  private countBusy = false;
  private countDirty = false;
  private countVersion = 0;
  private confirmedRead = new Set<string>();

  private api: NotificationGateway;
  constructor(api: NotificationGateway) { this.api = api; }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(patch: Partial<NotificationState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(listener => listener());
  }
  private controller() { const request = new AbortController(); this.requests.add(request); return request; }
  private alive(epoch: number) { return !this.disposed && epoch === this.lifecycle; }
  activate() {
    if (this.disposed) {
      this.disposed = false;
      this.countBusy = false;
      this.countDirty = false;
      this.update({ isLoading: true, isLoadingMore: false, isMarkingAll: false, pendingReadIds: [] });
    }
  }
  dispose() {
    this.disposed = true;
    this.lifecycle++;
    this.requests.forEach(request => request.abort());
    this.requests.clear();
  }
  private merge(items: Notification[]) {
    const byId = new Map(this.state.notifications.map(item => [item.id, item]));
    for (const item of items) {
      if (!isNotification(item)) continue;
      const old = byId.get(item.id);
      byId.set(item.id, { ...item, isRead: item.isRead || old?.isRead === true || this.confirmedRead.has(item.id) });
    }
    return [...byId.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id));
  }
  private applyCount(unreadCount: number) {
    if (unreadCount === 0) {
      this.state.notifications.forEach(n => this.confirmedRead.add(n.id));
      this.update({ unreadCount, notifications: this.state.notifications.map(n => ({ ...n, isRead: true })) });
    } else this.update({ unreadCount });
  }

  refresh = async (): Promise<void> => {
    if (this.disposed) return;
    this.head?.abort();
    this.more?.abort();
    const request = this.controller();
    this.head = request;
    const epoch = this.lifecycle, version = ++this.headVersion, revision = this.revision, countVersion = ++this.countVersion;
    this.update({ isLoading: true, isLoadingMore: false, error: null });
    try {
      const feed = await this.api.feed({ size: 20 }, request.signal);
      if (!this.alive(epoch) || version !== this.headVersion || request.signal.aborted) return;
      this.update({ notifications: this.merge(feed.items), nextCursor: feed.nextCursor });
      if (revision === this.revision && countVersion === this.countVersion) this.applyCount(feed.unreadCount);
      else void this.syncCount();
    } catch (error) {
      if (this.alive(epoch) && version === this.headVersion && !request.signal.aborted) this.update({ error: message(error) });
    } finally {
      this.requests.delete(request);
      if (this.alive(epoch) && version === this.headVersion) this.update({ isLoading: false });
    }
  };

  loadMore = async (): Promise<void> => {
    if (this.disposed || this.state.isLoading || this.state.isLoadingMore || !this.state.nextCursor) return;
    const epoch = this.lifecycle, version = this.headVersion;
    const request = this.controller();
    this.more = request;
    this.update({ isLoadingMore: true, error: null });
    let cursor: string | null = this.state.nextCursor;
    try {
      // Refresh preserves cached rows. Skip already-cached pages without skipping any gap
      // introduced by new notifications; bound each click to five pages.
      for (let page = 0; page < 5 && cursor; page++) {
        const revision = this.revision, countVersion = ++this.countVersion;
        const feed = await this.api.feed({ cursor, size: 20 }, request.signal);
        if (!this.alive(epoch) || version !== this.headVersion || request.signal.aborted) return;
        const oldIds = new Set(this.state.notifications.map(n => n.id));
        const hasNew = feed.items.some(n => !oldIds.has(n.id));
        this.update({ notifications: this.merge(feed.items), nextCursor: feed.nextCursor });
        if (revision === this.revision && countVersion === this.countVersion) this.applyCount(feed.unreadCount);
        else void this.syncCount();
        if (hasNew || feed.nextCursor === cursor) break;
        cursor = feed.nextCursor;
      }
    } catch (error) {
      if (this.alive(epoch) && !request.signal.aborted) this.update({ error: message(error) });
    } finally {
      this.requests.delete(request);
      if (this.alive(epoch) && version === this.headVersion) this.update({ isLoadingMore: false });
    }
  };

  receive = (item: Notification): boolean => {
    if (this.disposed || !isNotification(item)) return false;
    const fresh = !this.state.notifications.some(n => n.id === item.id);
    this.revision++;
    this.update({ notifications: this.merge([item]) });
    void this.syncCount();
    return fresh;
  };

  syncCount = async (): Promise<void> => {
    if (this.disposed) return;
    this.countDirty = true;
    if (this.countBusy) return;
    this.countBusy = true;
    const epoch = this.lifecycle;
    try {
      while (this.countDirty && this.alive(epoch)) {
        this.countDirty = false;
        const revision = this.revision, request = this.controller(), countVersion = ++this.countVersion;
        try {
          const count = await this.api.count(request.signal);
          if (!this.alive(epoch)) return;
          if (revision === this.revision && countVersion === this.countVersion) this.applyCount(count);
          else if (revision !== this.revision) this.countDirty = true;
        } catch (error) {
          if (this.alive(epoch) && !request.signal.aborted) this.update({ error: message(error) });
          return;
        } finally { this.requests.delete(request); }
      }
    } finally { if (this.alive(epoch)) this.countBusy = false; }
  };

  markAsRead = async (id: string): Promise<void> => {
    if (this.disposed || this.state.pendingReadIds.includes(id) || this.state.isMarkingAll) return;
    const epoch = this.lifecycle, request = this.controller();
    this.update({ pendingReadIds: [...this.state.pendingReadIds, id], error: null });
    try {
      await this.api.read(id, request.signal);
      if (!this.alive(epoch)) return;
      this.revision++;
      this.confirmedRead.add(id);
      this.update({ notifications: this.state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n) });
      await this.syncCount();
    } catch (error) {
      if (this.alive(epoch) && !request.signal.aborted) { this.update({ error: message(error) }); throw error; }
    } finally {
      this.requests.delete(request);
      if (this.alive(epoch)) this.update({ pendingReadIds: this.state.pendingReadIds.filter(value => value !== id) });
    }
  };

  markAllAsRead = async (): Promise<void> => {
    if (this.disposed || this.state.isMarkingAll || this.state.pendingReadIds.length) return;
    const epoch = this.lifecycle, request = this.controller();
    const ids = new Set(this.state.notifications.map(n => n.id));
    this.update({ isMarkingAll: true, error: null });
    try {
      await this.api.readAll(request.signal);
      if (!this.alive(epoch)) return;
      this.revision++;
      ids.forEach(id => this.confirmedRead.add(id));
      this.update({ notifications: this.state.notifications.map(n => ids.has(n.id) ? { ...n, isRead: true } : n) });
      await this.refresh(); // Discard older feed requests and reconcile arrivals during the PUT.
      await this.syncCount();
    } catch (error) {
      if (this.alive(epoch) && !request.signal.aborted) { this.update({ error: message(error) }); throw error; }
    } finally {
      this.requests.delete(request);
      if (this.alive(epoch)) this.update({ isMarkingAll: false });
    }
  };
}
