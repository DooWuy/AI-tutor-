import assert from 'node:assert/strict';
import { test } from 'node:test';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { tsLoader } from './helpers/loadTs.mjs';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://app.example.test' });
globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const dto = id => ({ id: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`, type: 'CLASS_REMINDER', title: 'Title',
  message: 'Message', link: null, isRead: false, createdAt: '2026-10-21T00:00:00Z', metadata: {} });
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };

async function setup(feed = async () => ({ items: [], nextCursor: null, unreadCount: 0 })) {
  let auth = { isAuthenticated: true, user: { userId: 'one' }, token: 'one-token' }, connected = false, hook;
  let hidden = false;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  const calls = { feed: 0, toast: 0, native: 0, permission: 0 };
  class BrowserNotification {
    static permission = 'default';
    static async requestPermission() { calls.permission++; return 'granted'; }
    constructor() { calls.native++; }
  }
  window.Notification = BrowserNotification;
  const intervals = new Map(); let timerId = 0;
  window.setInterval = (callback, delay) => { const id = ++timerId; intervals.set(id, { callback, delay }); return id; };
  window.clearInterval = id => intervals.delete(id);
  const toast = { info() { calls.toast++; } };
  const load = tsLoader({ mocks: {
    '/AuthContext': { useAuth: () => auth }, '/ToastContext': { useToast: () => ({ toast }) },
    '/useWebSocket': { useWebSocket: (...args) => { hook = args; return { isConnected: connected }; } },
    '/notificationApi': { getNotificationFeed: (...args) => { calls.feed++; return feed(...args); },
      getNotificationUnreadCount: async () => 2, markNotificationAsRead: async () => {}, markAllNotificationsAsRead: async () => {} },
  }, globals: { window, document } });
  const { NotificationProvider, useNotification } = load('src/context/NotificationContext.tsx');
  let snapshot;
  function Probe() { snapshot = useNotification(); return React.createElement('span', null, snapshot.notifications.length); }
  const container = document.createElement('div'); document.body.append(container); const root = createRoot(container);
  const render = async () => { await act(async () => root.render(React.createElement(NotificationProvider, null, React.createElement(Probe)))); };
  await render();
  return { calls, intervals, BrowserNotification, snapshot: () => snapshot, hook: () => hook,
    hidden: value => { hidden = value; },
    connected: async value => { connected = value; await render(); },
    auth: async value => { auth = value; await render(); },
    cleanup: async () => { await act(async () => root.unmount()); container.remove(); },
  };
}

test('reconnect/focus/visibility resync while fallback polling runs only visible and disconnected', async () => {
  const ui = await setup();
  try {
    assert.equal(ui.calls.feed, 1);
    assert.equal([...ui.intervals.values()][0].delay, 30000);
    ui.hidden(true);
    await act(async () => [...ui.intervals.values()][0].callback()); assert.equal(ui.calls.feed, 1);
    ui.hidden(false);
    await act(async () => [...ui.intervals.values()][0].callback()); assert.equal(ui.calls.feed, 2);
    await ui.connected(true);
    await act(async () => [...ui.intervals.values()][0].callback()); assert.equal(ui.calls.feed, 2);
    await act(async () => ui.hook()[3]()); assert.equal(ui.calls.feed, 3);
    await act(async () => window.dispatchEvent(new window.Event('focus'))); assert.equal(ui.calls.feed, 4);
    await act(async () => document.dispatchEvent(new window.Event('visibilitychange'))); assert.equal(ui.calls.feed, 5);
  } finally { await ui.cleanup(); }
  assert.equal(ui.intervals.size, 0);
});

test('switching directly between authenticated accounts resets state and aborts the previous fetch', async () => {
  const old = deferred(); let oldSignal; let request = 0;
  const ui = await setup((_options, signal) => {
    if (++request === 1) { oldSignal = signal; return old.promise; }
    return Promise.resolve({ items: [dto(2)], nextCursor: null, unreadCount: 1 });
  });
  try {
    await ui.auth({ isAuthenticated: true, user: { userId: 'two' }, token: 'two-token' });
    assert.equal(oldSignal.aborted, true);
    await act(async () => { old.resolve({ items: [dto(1)], nextCursor: 'old', unreadCount: 99 }); await old.promise; });
    assert.deepEqual(Array.from(ui.snapshot().notifications, n => n.id), [dto(2).id]);
    assert.equal(ui.snapshot().unreadCount, 1);
    await ui.auth({ isAuthenticated: false, user: null, token: null });
    assert.equal(ui.snapshot().notifications.length, 0); assert.equal(ui.snapshot().unreadCount, 0);
  } finally { await ui.cleanup(); }
});

test('duplicate events toast once, browser alerts require existing permission and no auto permission prompt occurs', async () => {
  const ui = await setup();
  try {
    assert.equal(ui.calls.permission, 0);
    await act(async () => { ui.hook()[2](dto(1)); ui.hook()[2](dto(1)); });
    assert.equal(ui.calls.toast, 1); assert.equal(ui.calls.native, 0);
    ui.hidden(true); ui.BrowserNotification.permission = 'granted';
    await act(async () => ui.hook()[2](dto(2)));
    assert.equal(ui.calls.native, 1); assert.equal(ui.calls.permission, 0);
  } finally { await ui.cleanup(); }
});
