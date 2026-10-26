import assert from 'node:assert/strict';
import { test } from 'node:test';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { tsLoader } from './helpers/loadTs.mjs';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://app.example.test' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const session = { accessToken: 'new-token', user: { userId: 'student-id', role: 'STUDENT', fullName: 'Nguyễn An' } };
const response = (data, status = 200) => new Response(JSON.stringify({ success: status < 400, data, message: 'Sai thông tin đăng nhập' }),
  { status, headers: { 'Content-Type': 'application/json' } });
const storage = () => {
  const items = new Map();
  return { getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, String(value)), removeItem: key => items.delete(key) };
};
function setup(fetch) {
  const localStorage = storage(), sessionStorage = storage();
  const load = tsLoader({ env: { VITE_API_BASE_URL: 'https://api.example.test/api/v1/' },
    globals: { fetch, localStorage, sessionStorage } });
  return { api: load('src/services/authApi.ts'), load, localStorage, sessionStorage };
}

test('login and registration include cookies and preserve password characters', async () => {
  const calls = [];
  const { api } = setup(async (url, init) => { calls.push({ url, init }); return response(session); });
  const credentials = { email: 'student', password: ' Secret123! ' };
  await api.login(credentials);
  await api.register({ ...credentials, username: 'student' });
  assert.deepEqual(calls.map(call => call.url), ['https://api.example.test/api/v1/auth/login', 'https://api.example.test/api/v1/auth/register']);
  for (const { init } of calls) {
    assert.equal(init.credentials, 'include');
    assert.equal(JSON.parse(init.body).password, credentials.password);
  }
});

test('incomplete or malformed persisted sessions do not mask a valid session', () => {
  for (const badUser of ['{', 'null', '{}', JSON.stringify(session.user)]) {
    const { api, localStorage, sessionStorage } = setup();
    localStorage.setItem('ai-tutor.user', badUser);
    sessionStorage.setItem('ai-tutor.user', JSON.stringify(session.user));
    sessionStorage.setItem('ai-tutor.access-token', session.accessToken);
    assert.equal(api.getStoredSession().accessToken, session.accessToken);
    assert.equal(localStorage.getItem('ai-tutor.user'), null);
  }
});

test('remember choice selects storage and clears the previous account', () => {
  const { api, localStorage, sessionStorage } = setup();
  api.persistSession(session, true);
  assert.equal(localStorage.getItem('ai-tutor.access-token'), session.accessToken);
  api.persistSession({ ...session, accessToken: 'temporary' }, false);
  assert.equal(localStorage.getItem('ai-tutor.user'), null);
  assert.equal(sessionStorage.getItem('ai-tutor.access-token'), 'temporary');
});

test('registration immediately authenticates React consumers and persists the session', async () => {
  const { load, api } = setup(async () => response(session));
  const { AuthProvider, useAuth } = load('src/context/AuthContext.tsx');
  let auth;
  function Probe() { auth = useAuth(); return React.createElement('span', null, String(auth.isAuthenticated)); }
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    await act(async () => root.render(React.createElement(AuthProvider, null, React.createElement(Probe))));
    assert.equal(auth.isAuthenticated, false);
    await act(async () => { await auth.register({ username: 'student' }); });
    assert.equal(auth.isAuthenticated, true);
    assert.equal(auth.user.userId, session.user.userId);
    assert.equal(auth.token, session.accessToken);
    assert.equal(api.getStoredSession().accessToken, session.accessToken);
    assert.equal(container.textContent, 'true');
  } finally { await act(async () => root.unmount()); }
});

test('rejected login leaves React unauthenticated and clears loading', async () => {
  const { load } = setup(async () => response(null, 401));
  const { AuthProvider, useAuth } = load('src/context/AuthContext.tsx');
  let auth;
  function Probe() { auth = useAuth(); return null; }
  const root = createRoot(document.createElement('div'));
  try {
    await act(async () => root.render(React.createElement(AuthProvider, null, React.createElement(Probe))));
    await act(async () => { await assert.rejects(auth.login({ email: 'student', password: 'wrong' }), /Sai thông tin/); });
    assert.equal(auth.isAuthenticated, false);
    assert.equal(auth.isLoading, false);
  } finally { await act(async () => root.unmount()); }
});
