import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tsLoader } from './helpers/loadTs.mjs';

function setup(transport) {
  return tsLoader({ env: { VITE_API_BASE_URL: 'https://api.example.test/api/v1/' }, globals: { fetch: transport } })('src/services/notificationApi.ts');
}
const response = (data, status = 200, success = status < 400) => new Response(JSON.stringify({ success, data, message: 'Server message' }),
  { status, headers: { 'Content-Type': 'application/json' } });

test('feed sends cursor/size/unread filters with cookie authentication', async () => {
  const api = setup(async (url, init) => {
    const parsed = new URL(url);
    assert.equal(parsed.pathname, '/api/v1/notifications/feed');
    assert.equal(parsed.searchParams.get('cursor'), 'cursor/+?=');
    assert.equal(parsed.searchParams.get('size'), '7');
    assert.equal(parsed.searchParams.get('unreadOnly'), 'true');
    assert.equal(init.credentials, 'include');
    return response({ items: [], nextCursor: 'next', unreadCount: 105 });
  });
  const feed = await api.getNotificationFeed({ cursor: 'cursor/+?=', size: 7, unreadOnly: true });
  assert.equal(feed.unreadCount, 105);
  assert.equal(feed.nextCursor, 'next');
});

test('legacy helper consumes the bounded feed and unread count has its own endpoint', async () => {
  const calls = [];
  const api = setup(async url => {
    calls.push(url);
    return response(url.endsWith('/unread-count') ? { unreadCount: 130 } : { items: [{ id: '00000000-0000-4000-8000-000000000001',
      type: 'CLASS_REMINDER', title: 'Title', message: 'Message', link: null, isRead: false, createdAt: '2026-10-21T00:00:00Z', metadata: {} }], nextCursor: 'next', unreadCount: 130 });
  });
  assert.equal((await api.getMyNotifications())[0].id, '00000000-0000-4000-8000-000000000001');
  assert.equal(await api.getNotificationUnreadCount(), 130);
  assert.deepEqual(calls, ['https://api.example.test/api/v1/notifications/feed', 'https://api.example.test/api/v1/notifications/unread-count']);
});

test('read operations encode IDs and check success responses', async () => {
  const calls = [];
  const api = setup(async (url, init) => { calls.push([url, init.method]); return response(null); });
  await api.markNotificationAsRead('id/with?reserved');
  await api.markAllNotificationsAsRead();
  assert.deepEqual(calls, [
    ['https://api.example.test/api/v1/notifications/id%2Fwith%3Freserved/read', 'PUT'],
    ['https://api.example.test/api/v1/notifications/read-all', 'PUT'],
  ]);
});

test('HTTP and application failures reject instead of acknowledging read', async () => {
  for (const status of [401, 403, 404, 500, 200]) {
    const api = setup(async () => response(null, status, false));
    await assert.rejects(() => api.markNotificationAsRead('id'), /Server message/);
    await assert.rejects(() => api.markAllNotificationsAsRead(), /Server message/);
    await assert.rejects(() => api.getNotificationFeed(), /Server message/);
  }
});
