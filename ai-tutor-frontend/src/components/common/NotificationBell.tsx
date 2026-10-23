import { useEffect, useId, useRef, useState } from 'react';
import { Bell, BellOff, CheckCheck, LoaderCircle, RefreshCw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { safeNotificationLink } from '../../services/notificationValidation';
import type { Notification as AppNotification } from '../../types/notification';

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface';
const action = `rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed ${focus}`;

export function NotificationBell() {
  const { user, isAuthenticated } = useAuth();
  return isAuthenticated && user ? <NotificationBellSession key={user.userId} role={user.role} /> : null;
}

function NotificationBellSession({ role }: { role: string }) {
  const { notifications, unreadCount, nextCursor, isLoading, isLoadingMore, isConnected, error,
    pendingReadIds, isMarkingAll, markAsRead, markAllAsRead, refreshNotifications, loadMore } = useNotification();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'unsupported');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const titleId = useId(), panelId = useId();

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);

  const clickNotification = async (notification: AppNotification) => {
    try {
      if (!notification.isRead) await markAsRead(notification.id);
      if (!mounted.current) return;
      const link = safeNotificationLink(notification.link, role);
      setOpen(false);
      trigger.current?.focus();
      if (link) navigate(link);
    } catch { /* Context retains the error and unread item so the action can be retried. */ }
  };
  const askPermission = async () => {
    if (!('Notification' in window)) return;
    setPermissionBusy(true);
    setPermissionError(null);
    try {
      const result = await window.Notification.requestPermission();
      if (mounted.current) setPermission(result);
    } catch {
      if (mounted.current) setPermissionError('Chưa bật được thông báo trình duyệt. Bạn có thể thử lại.');
    } finally { if (mounted.current) setPermissionBusy(false); }
  };

  return <div className="relative shrink-0" ref={root} onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }}>
    <button ref={trigger} type="button" aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? panelId : undefined}
      className={`relative grid h-11 w-11 place-items-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary ${focus}`}
      onClick={() => {
        setOpen(value => !value);
        if (!open) {
          if ('Notification' in window) setPermission(window.Notification.permission);
          void refreshNotifications();
        }
      }}>
      <Bell size={20} aria-hidden="true" />
      {unreadCount > 0 && <span aria-hidden="true" className="absolute right-0 top-0 rounded-full bg-error px-1.5 text-[10px] font-bold leading-5 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>

    {open && <div ref={panel} tabIndex={-1} role="dialog" id={panelId} aria-labelledby={titleId}
      className={`fixed inset-x-3 top-[4.75rem] z-[70] flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface text-on-surface shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 ${focus}`}>
      <div className="flex items-start justify-between gap-3 border-b border-outline-variant px-4 py-3">
        <div>
          <h2 id={titleId} className="text-base font-semibold">Thông báo</h2>
          <p className="mt-0.5 text-xs text-on-surface-variant" role="status">{isConnected ? 'Đang cập nhật trực tiếp' : 'Đồng bộ định kỳ khi bạn mở ứng dụng'}</p>
        </div>
        <button type="button" aria-label="Đóng thông báo" className={`rounded-lg p-2 hover:bg-surface-container ${focus}`}
          onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={18} aria-hidden="true" /></button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-1 px-2 py-1">
        <button type="button" className={action} disabled={unreadCount === 0 || isMarkingAll || pendingReadIds.length > 0}
          onClick={() => { void markAllAsRead().catch(() => {}); }}>
          <CheckCheck size={16} className="mr-1 inline" aria-hidden="true" />{isMarkingAll ? 'Đang cập nhật…' : 'Đọc tất cả'}
        </button>
        <button type="button" aria-label="Làm mới thông báo" className={action} disabled={isLoading}
          onClick={() => { void refreshNotifications(); }}><RefreshCw size={16} aria-hidden="true" /></button>
      </div>
      <div className="min-h-0 overflow-y-auto overscroll-contain px-2 pb-2">
        {error && <div role="alert" className="mb-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-on-surface">
          <p>{error}</p><button type="button" className={action} onClick={() => { void refreshNotifications(); }}>Thử lại</button>
        </div>}
        {isLoading && <p role="status" className="flex items-center justify-center gap-2 py-4 text-sm text-on-surface-variant">
          <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />Đang tải thông báo…
        </p>}
        {!isLoading && !error && notifications.length === 0 && <div className="px-4 py-8 text-center text-sm text-on-surface-variant">
          <BellOff size={28} className="mx-auto mb-2" aria-hidden="true" /><p>Bạn chưa có thông báo nào.</p>
        </div>}
        <ul aria-label="Danh sách thông báo" className="space-y-1">
          {notifications.map(notification => <li key={notification.id}>
            <button type="button" aria-busy={pendingReadIds.includes(notification.id)}
              disabled={isMarkingAll || pendingReadIds.includes(notification.id)}
              onClick={() => { void clickNotification(notification); }}
              className={`w-full rounded-xl p-3 text-left transition-colors hover:bg-surface-container disabled:cursor-wait disabled:opacity-60 ${focus} ${notification.isRead ? '' : 'bg-primary/5'}`}>
              <span className="flex items-start justify-between gap-2">
                <span className="break-words text-sm font-semibold">{notification.title}</span>
                {!notification.isRead && <span className="shrink-0 text-xs font-medium text-primary">Chưa đọc</span>}
              </span>
              <span className="mt-1 block break-words text-sm text-on-surface-variant">{notification.message}</span>
              <time dateTime={notification.createdAt} className="mt-2 block text-xs text-on-surface-variant">{new Date(notification.createdAt).toLocaleString('vi-VN')}</time>
            </button>
          </li>)}
        </ul>
        {nextCursor && <button type="button" className={`${action} mt-2 w-full`} disabled={isLoading || isLoadingMore}
          onClick={() => { void loadMore(); }}>{isLoadingMore ? 'Đang tải thêm…' : 'Tải thêm thông báo'}</button>}
      </div>
      {permission !== 'unsupported' && <div className="border-t border-outline-variant px-3 py-2 text-xs text-on-surface-variant">
        {permission === 'default' && <button type="button" className={`${action} w-full`} disabled={permissionBusy}
          onClick={() => { void askPermission(); }}>{permissionBusy ? 'Đang yêu cầu quyền…' : 'Bật thông báo trình duyệt'}</button>}
        {permission === 'denied' && <p>Thông báo trình duyệt đang bị chặn. Bạn vẫn nhận được thông báo trong ứng dụng.</p>}
        {permission === 'granted' && <p>Đã bật thông báo trình duyệt.</p>}
        {permissionError && <p role="alert">{permissionError}</p>}
      </div>}
    </div>}
  </div>;
}
