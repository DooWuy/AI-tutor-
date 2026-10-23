import assert from 'node:assert/strict';
import { test } from 'node:test';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { tsLoader } from './helpers/loadTs.mjs';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://app.example.test/student/dashboard' });
globalThis.window = dom.window; globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const notification = { id: '00000000-0000-4000-8000-000000000001', type: 'CLASS_REMINDER', title: 'Sắp đến giờ học: Toán',
  message: 'Bạn có tiết học lúc 07:15.', link: '/student/timetable', isRead: false, createdAt: '2026-10-21T00:00:00Z', metadata: {} };

async function setup(overrides = {}) {
  let auth = { isAuthenticated: true, user: { userId: 'one', role: 'STUDENT' } };
  const calls = { refresh: 0, more: 0, read: [], all: 0, permissions: 0, navigate: [] };
  class BrowserNotification {
    static permission = 'default';
    static async requestPermission() { calls.permissions++; this.permission = 'granted'; return 'granted'; }
  }
  window.Notification = BrowserNotification;
  let state = { notifications: [notification], unreadCount: 42, nextCursor: 'next', isLoading: false, isLoadingMore: false,
    isConnected: false, isMarkingAll: false, pendingReadIds: [], error: null,
    refreshNotifications: async () => { calls.refresh++; }, loadMore: async () => { calls.more++; },
    markAsRead: async id => { calls.read.push(id); }, markAllAsRead: async () => { calls.all++; }, ...overrides };
  const { NotificationBell } = tsLoader({ mocks: { '/AuthContext': { useAuth: () => auth },
    '/NotificationContext': { useNotification: () => state }, 'react-router-dom': { useNavigate: () => path => calls.navigate.push(path) } },
    globals: { window, document } })('src/components/common/NotificationBell.tsx');
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  const render = async () => { await act(async () => root.render(React.createElement(NotificationBell))); };
  await render();
  const click = async element => { assert.ok(element); await act(async () => element.click()); };
  const find = text => [...container.querySelectorAll('button')].find(button => button.textContent.includes(text));
  const open = () => click(container.querySelector('[aria-haspopup="dialog"]'));
  return { container, calls, find, open, click,
    update: async patch => { state = { ...state, ...patch }; await render(); },
    auth: async value => { auth = value; await render(); },
    cleanup: async () => { await act(async () => root.unmount()); container.remove(); },
  };
}

test('bell is keyboard-labelled, uses server unread count, focuses popup and restores focus on Escape', async () => {
  const ui = await setup();
  try {
    const trigger = ui.container.querySelector('[aria-haspopup="dialog"]');
    assert.match(trigger.getAttribute('aria-label'), /42 chưa đọc/);
    assert.equal(ui.calls.permissions, 0);
    await ui.open();
    assert.equal(document.activeElement.getAttribute('role'), 'dialog');
    assert.equal(trigger.getAttribute('aria-expanded'), 'true');
    await act(async () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    assert.equal(ui.container.querySelector('[role="dialog"]'), null);
    assert.equal(document.activeElement, trigger);
  } finally { await ui.cleanup(); }
});

test('permission is requested only on explicit click and pagination/read-all are actionable', async () => {
  const ui = await setup();
  try {
    await ui.open(); assert.equal(ui.calls.permissions, 0);
    await ui.click(ui.find('Bật thông báo trình duyệt'));
    assert.equal(ui.calls.permissions, 1);
    assert.match(ui.container.textContent, /Đã bật thông báo trình duyệt/);
    await ui.click(ui.find('Tải thêm thông báo')); assert.equal(ui.calls.more, 1);
    await ui.click(ui.find('Đọc tất cả')); assert.equal(ui.calls.all, 1);
  } finally { await ui.cleanup(); }
});

test('loading, error/retry and empty states remain distinct and accessible', async () => {
  const ui = await setup({ notifications: [], isLoading: true, nextCursor: null, unreadCount: 0 });
  try {
    await ui.open();
    assert.match(ui.container.textContent, /Đang tải thông báo/);
    assert.doesNotMatch(ui.container.textContent, /chưa có thông báo/);
    await ui.update({ isLoading: false, error: 'Kết nối gián đoạn' });
    assert.match(ui.container.querySelector('[role="alert"]').textContent, /Kết nối gián đoạn/);
    await ui.click(ui.find('Thử lại')); assert.ok(ui.calls.refresh >= 2);
    await ui.update({ error: null }); assert.match(ui.container.textContent, /chưa có thông báo/);
    assert.equal(ui.find('Đọc tất cả').disabled, true);
  } finally { await ui.cleanup(); }
});

test('notification is marked read before navigating; a failed PUT keeps the popup open', async () => {
  const ui = await setup({ markAsRead: async () => { throw new Error('Failure'); } });
  try {
    await ui.open(); await ui.click(ui.find('Sắp đến giờ học'));
    assert.equal(ui.calls.navigate.length, 0); assert.ok(ui.container.querySelector('[role="dialog"]'));
    await ui.update({ markAsRead: async id => { ui.calls.read.push(id); } });
    await ui.click(ui.find('Sắp đến giờ học'));
    assert.deepEqual(ui.calls.read, [notification.id]);
    assert.deepEqual(ui.calls.navigate, ['/student/timetable']);
  } finally { await ui.cleanup(); }
});

test('switching accounts unmounts the old action and prevents stale navigation', async () => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const ui = await setup({ markAsRead: () => pending });
  try {
    await ui.open();
    await act(async () => { ui.find('Sắp đến giờ học').click(); });
    await ui.auth({ isAuthenticated: true, user: { userId: 'two', role: 'TEACHER' } });
    await act(async () => { finish(); await pending; });
    assert.equal(ui.calls.navigate.length, 0);
    assert.equal(ui.container.querySelector('[role="dialog"]'), null);
  } finally { await ui.cleanup(); }
});

test('foreign-role or external links never navigate and pending buttons are disabled', async () => {
  const ui = await setup({ notifications: [{ ...notification, link: '/admin/students' }], pendingReadIds: [notification.id] });
  try {
    await ui.open(); assert.equal(ui.find('Sắp đến giờ học').disabled, true);
    await ui.update({ pendingReadIds: [] });
    await ui.click(ui.find('Sắp đến giờ học'));
    assert.equal(ui.calls.navigate.length, 0);
    assert.equal(ui.calls.read.length, 1);
  } finally { await ui.cleanup(); }
});
