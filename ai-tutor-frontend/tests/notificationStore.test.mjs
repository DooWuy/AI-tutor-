import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tsLoader } from './helpers/loadTs.mjs';

const { NotificationStore } = tsLoader()('src/services/notificationStore.ts');
const { isNotification, safeNotificationLink } = tsLoader()('src/services/notificationValidation.ts');
const dto = (id, props = {}) => ({ id: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`, type: 'CLASS_REMINDER',
  title: 'Sắp đến giờ học', message: 'Toán lúc 07:15', link: '/student/timetable', isRead: false,
  createdAt: `2026-10-21T00:00:${String(id % 60).padStart(2, '0')}Z`, metadata: {}, ...props });
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const flush = () => new Promise(resolve => setImmediate(resolve));
const gateway = overrides => ({ feed: async () => ({ items: [], nextCursor: null, unreadCount: 10 }),
  count: async () => 10, read: async () => {}, readAll: async () => {}, ...overrides });

test('validates full payloads, legacy types and role-safe internal links', () => {
  assert.equal(isNotification(dto(1)), true);
  assert.equal(isNotification(dto(1, { type: 'LEGACY_TYPE' })), true);
  for (const invalid of [{ type: 'QUIZ_GENERATED', quizId: 'id' }, null, dto(1, { isRead: 'false' }), dto(1, { createdAt: 'yesterday' }),
    dto(1, { metadata: [] }), dto(1, { title: '' }), dto(1, { metadata: { slotId: 'wrong-id' } })]) assert.equal(isNotification(invalid), false);
  assert.equal(safeNotificationLink('/teacher/quizzes/1', 'TEACHER'), '/teacher/quizzes/1');
  for (const link of ['//evil.test', 'https://evil.test', '/student/../admin/students', '/student/\\evil', '/admin/students', 'javascript:alert(1)']) {
    assert.equal(safeNotificationLink(link, 'STUDENT'), null, link);
  }
});

test('burst events are delivered individually and duplicate IDs do not duplicate the list', async () => {
  const store = new NotificationStore(gateway());
  assert.equal(store.receive(dto(1)), true);
  assert.equal(store.receive(dto(2)), true);
  assert.equal(store.receive(dto(1)), false);
  assert.equal(store.getSnapshot().notifications.length, 2);
  await flush();
  assert.equal(store.getSnapshot().unreadCount, 10); // Never counts only the loaded rows.
});

test('late initial REST response preserves messages received during the fetch', async () => {
  const head = deferred();
  const store = new NotificationStore(gateway({ feed: () => head.promise, count: async () => 2 }));
  const refresh = store.refresh();
  store.receive(dto(2));
  head.resolve({ items: [dto(1)], nextCursor: 'next', unreadCount: 1 });
  await refresh; await flush();
  assert.deepEqual(Array.from(store.getSnapshot().notifications, n => n.id), [dto(2).id, dto(1).id]);
  assert.equal(store.getSnapshot().unreadCount, 2);
});

test('confirmed read cannot be reverted by an older REST snapshot or a replayed STOMP message', async () => {
  const head = deferred();
  const store = new NotificationStore(gateway({ feed: () => head.promise, count: async () => 1 }));
  store.receive(dto(1));
  const refresh = store.refresh();
  await store.markAsRead(dto(1).id);
  head.resolve({ items: [dto(1)], nextCursor: null, unreadCount: 2 });
  await refresh;
  store.receive(dto(1));
  assert.equal(store.getSnapshot().notifications[0].isRead, true);
});

test('older unread-count response cannot overwrite a newer feed snapshot', async () => {
  const count = deferred();
  const store = new NotificationStore(gateway({ count: () => count.promise,
    feed: async () => ({ items: [dto(1), dto(2)], nextCursor: null, unreadCount: 2 }) }));
  store.receive(dto(1));
  await store.refresh();
  count.resolve(1);
  await flush();
  assert.equal(store.getSnapshot().unreadCount, 2);
});

test('failed PUT retains unread state and exposes a retryable error', async () => {
  const store = new NotificationStore(gateway({ read: async () => { throw new Error('Không thể đánh dấu đã đọc'); } }));
  store.receive(dto(1));
  await assert.rejects(() => store.markAsRead(dto(1).id), /Không thể/);
  assert.equal(store.getSnapshot().notifications[0].isRead, false);
  assert.match(store.getSnapshot().error, /Không thể/);
  assert.equal(store.getSnapshot().pendingReadIds.length, 0);
});

test('account disposal aborts outstanding requests and ignored transports cannot modify state', async () => {
  const head = deferred(), read = deferred(); let signal;
  const old = new NotificationStore(gateway({ feed: (_options, value) => { signal = value; return head.promise; }, read: () => read.promise }));
  old.receive(dto(1));
  const refreshing = old.refresh(), reading = old.markAsRead(dto(1).id);
  old.dispose();
  assert.equal(signal.aborted, true);
  const current = new NotificationStore(gateway());
  head.resolve({ items: [dto(2)], nextCursor: null, unreadCount: 99 });
  read.resolve(); await refreshing; await reading;
  assert.equal(current.getSnapshot().notifications.length, 0);
  assert.equal(current.getSnapshot().unreadCount, 0);
  assert.equal(old.getSnapshot().notifications.length, 1);
  assert.equal(old.getSnapshot().notifications[0].isRead, false);
});

test('StrictMode cleanup/reactivation rejects requests from the previous effect lifetime', async () => {
  const old = deferred(); let requests = 0;
  const store = new NotificationStore(gateway({ feed: async () => ++requests === 1 ? old.promise : { items: [dto(2)], nextCursor: null, unreadCount: 1 } }));
  const first = store.refresh(); store.dispose(); store.activate();
  await store.refresh();
  old.resolve({ items: [dto(1)], nextCursor: 'old-cursor', unreadCount: 99 }); await first;
  assert.equal(store.getSnapshot().notifications.length, 1);
  assert.equal(store.getSnapshot().notifications[0].id, dto(2).id);
  assert.equal(store.getSnapshot().isLoading, false);
});

test('pagination merges overlapping pages and skips cached pages after a refresh', async () => {
  const calls = [];
  const store = new NotificationStore(gateway({ feed: async ({ cursor }) => {
    calls.push(cursor);
    return cursor === 'tail' ? { items: [dto(1)], nextCursor: null, unreadCount: 3 }
      : cursor === 'middle' ? { items: [dto(2)], nextCursor: 'tail', unreadCount: 3 }
      : { items: [dto(3)], nextCursor: 'middle', unreadCount: 3 };
  } }));
  await store.refresh(); await store.loadMore();
  await store.refresh(); await store.loadMore();
  assert.deepEqual(Array.from(store.getSnapshot().notifications, n => n.id), [dto(3).id, dto(2).id, dto(1).id]);
  assert.equal(store.getSnapshot().nextCursor, null);
  assert.deepEqual(calls, [undefined, 'middle', undefined, 'middle', 'tail']);
});

test('read-all reconciles arrivals while the PUT is in flight without marking later events blindly', async () => {
  const readAll = deferred();
  const store = new NotificationStore(gateway({ readAll: () => readAll.promise, count: async () => 1,
    feed: async () => ({ items: [dto(1, { isRead: true }), dto(2)], nextCursor: null, unreadCount: 1 }) }));
  store.receive(dto(1));
  const marking = store.markAllAsRead();
  store.receive(dto(2));
  readAll.resolve(); await marking;
  assert.equal(store.getSnapshot().notifications.find(n => n.id === dto(1).id).isRead, true);
  assert.equal(store.getSnapshot().notifications.find(n => n.id === dto(2).id).isRead, false);
  assert.equal(store.getSnapshot().unreadCount, 1);
  assert.equal(store.getSnapshot().isMarkingAll, false);
});
