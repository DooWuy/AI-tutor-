import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { tsLoader } from './helpers/loadTs.mjs';

test('account page handles loading, error retry, filters, empty state and explicit status confirmation', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://test/admin/users' });
  const previous = { window: globalThis.window, document: globalThis.document, IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT };
  globalThis.window = dom.window; globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  let resolve;
  let requests = [];
  let updates = [];
  let mode = 'pending';
  let active = true;
  const account = () => ({ userId: 'teacher-id', username: 'teacher1', fullName: 'Teacher One', email: 'teacher@test.invalid', role: 'TEACHER', active });
  const load = tsLoader({ mocks: {
    AuthContext: { useAuth: () => ({ user: { userId: 'admin-id' } }) },
    adminUserApi: {
      searchAccounts: async filters => { requests.push(filters); if (mode === 'pending') return new Promise(r => { resolve = r; });
        if (mode === 'error') throw new Error('Connection failed');
        return { content: mode === 'empty' ? [] : [account()], page: 1, totalPages: 1, totalElements: mode === 'empty' ? 0 : 1 };
      },
      setAccountStatus: async (id, target) => { updates.push([id, target]); active = target; return account(); },
    },
  }, globals: { window: dom.window } });
  const { UserManagementPage } = load('src/pages/Admin/Users/UserManagementPage.tsx');
  const root = createRoot(document.getElementById('root'));
  const click = async text => {
    const button = [...document.querySelectorAll('button')].find(b => b.textContent.startsWith(text));
    assert.ok(button, text); await act(async () => button.click());
  };
  try {
    await act(async () => root.render(React.createElement(UserManagementPage)));
    assert.match(document.body.textContent, /Đang tải tài khoản/);
    await act(async () => resolve({ content: [account()], page: 1, totalPages: 1, totalElements: 1 }));
    assert.match(document.body.textContent, /Teacher One/);
    await click('Khóa'); assert.ok(document.querySelector('dialog').open);
    await click('Xác nhận');
    assert.deepEqual(updates, [['teacher-id', false]]);
    mode = 'ready';
    await click('Xóa bộ lọc');
    const selects = document.querySelectorAll('select');
    mode = 'empty';
    await act(async () => { selects[0].value = 'STUDENT'; selects[0].dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
    assert.match(document.body.textContent, /Không tìm thấy tài khoản phù hợp/);
    assert.equal(requests.at(-1).role, 'STUDENT');
    mode = 'error'; await click('Xóa bộ lọc');
    assert.match(document.querySelector('[role="alert"]').textContent, /Connection failed/);
    mode = 'ready'; await click('Thử lại');
    assert.match(document.body.textContent, /Đang khóa/);
  } finally {
    await act(async () => root.unmount()); dom.window.close();
    Object.assign(globalThis, previous);
  }
});
