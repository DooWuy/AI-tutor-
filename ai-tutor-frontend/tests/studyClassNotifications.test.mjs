import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tsLoader } from './helpers/loadTs.mjs';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
const id = '00000000-0000-4000-8000-000000000001';
const dto = { id, type: 'STUDY_CLASS_JOIN_APPROVED', title: 'Đã duyệt', message: 'Chào mừng', link: `/student/classes/${id}`, isRead: false, createdAt: '2026-10-28T00:00:00Z', metadata: { classId: id, enrollmentId: id, className: 'Toán', enrollmentStatus: 'APPROVED' } };
test('enrollment metadata rejects missing IDs, invalid UUIDs and inconsistent status', () => {
  const { isNotification, safeNotificationLink } = tsLoader()('src/services/notificationValidation.ts');
  assert.equal(isNotification(dto), true);
  for (const patch of [{ classId: undefined }, { enrollmentId: 'bad' }, { className: 1 }, { enrollmentStatus: 'PENDING' }]) assert.equal(isNotification({ ...dto, metadata: { ...dto.metadata, ...patch } }), false);
  const requested = { ...dto, type: 'STUDY_CLASS_JOIN_REQUESTED', metadata: { ...dto.metadata, enrollmentStatus: 'PENDING' } };
  assert.equal(isNotification(requested), false);
  assert.equal(isNotification({ ...requested, metadata: { ...requested.metadata, studentId: id, studentName: 'An' } }), true);
  assert.equal(safeNotificationLink(dto.link, 'TEACHER'), null);
  assert.equal(safeNotificationLink(dto.link, 'STUDENT'), dto.link);
});
test('student API detail uses encoded ID and preserves application errors', async () => {
  let url;
  const api = tsLoader({ mocks: { './authApi': { getStoredSession: () => null } }, globals: { fetch: async value => { url = value; return new Response(JSON.stringify({ success: false, message: 'Không tìm thấy' }), { status: 404, headers: { 'Content-Type': 'application/json' } }); } } })('src/services/studyClassApi.ts');
  await assert.rejects(api.getMyStudyClass('a/b'), /Không tìm thấy/);
  assert.ok(url.endsWith('/student/study-classes/a%2Fb'));
});
test('result hook refetches only matching events once, including read and REST replay', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  let notifications = [], revision;
  const { useStudyClassUpdates } = tsLoader({ mocks: { '/NotificationContext': { useNotification: () => ({ notifications }) } } })('src/hooks/useStudyClassUpdates.ts');
  function Probe() { revision = useStudyClassUpdates(id); return null; }
  const root = createRoot(document.getElementById('root'));
  const render = () => act(async () => root.render(React.createElement(Probe)));
  try {
    await render(); assert.equal(revision, 0);
    notifications = [dto]; await render(); assert.equal(revision, 1);
    notifications = [{ ...dto, isRead: true }]; await render(); assert.equal(revision, 1);
    notifications = [{ ...dto, id: 'other', metadata: { ...dto.metadata, classId: 'another' } }]; await render(); assert.equal(revision, 1);
    notifications = [{ ...dto, id: 'rejected', type: 'STUDY_CLASS_JOIN_REJECTED' }]; await render(); assert.equal(revision, 2);
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});

test('teacher update hook reacts only to matching join requests once', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  let notifications = [], revision;
  const { useStudyClassUpdates } = tsLoader({ mocks: { '/NotificationContext': { useNotification: () => ({ notifications }) } } })('src/hooks/useStudyClassUpdates.ts');
  function Probe() { revision = useStudyClassUpdates(id, ['STUDY_CLASS_JOIN_REQUESTED']); return null; }
  const root = createRoot(document.getElementById('root'));
  const render = () => act(async () => root.render(React.createElement(Probe)));
  const requested = { ...dto, id: 'requested', type: 'STUDY_CLASS_JOIN_REQUESTED', metadata: { ...dto.metadata, enrollmentStatus: 'PENDING', studentId: id, studentName: 'An' } };
  try {
    await render(); assert.equal(revision, 0);
    notifications = [requested]; await render(); assert.equal(revision, 1);
    notifications = [{ ...requested, isRead: true }]; await render(); assert.equal(revision, 1);
    notifications = [{ ...requested, id: 'other-class', metadata: { ...requested.metadata, classId: 'another' } }]; await render(); assert.equal(revision, 1);
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});
