import test from 'node:test';
import assert from 'node:assert/strict';
import { tsLoader } from './helpers/loadTs.mjs';

function api(fetch) {
  return tsLoader({ mocks: { authApi: { getStoredSession: () => ({ accessToken: 'test-token' }) } },
    globals: { fetch }, env: { VITE_API_BASE_URL: '/api/v1' } })('src/services/adminUserApi.ts');
}
test('search preserves filters and cancellation; status carries explicit target and cookie auth', async () => {
  const calls = [];
  const client = api(async (url, init) => {
    calls.push({ url, init });
    return Response.json(url.includes('/accounts?') ? { content: [], totalElements: 0 } : { success: true, data: { active: false } });
  });
  const signal = new AbortController().signal;
  await client.searchAccounts({ search: 'a+b@example.test', active: 'false', role: 'TEACHER', page: 2, size: 20, sort: 'fullName', direction: 'asc' }, signal);
  const query = new URL(calls[0].url, 'http://test').searchParams;
  assert.equal(query.get('search'), 'a+b@example.test'); assert.equal(query.get('active'), 'false');
  assert.equal(calls[0].init.signal, signal);
  await client.setAccountStatus('id/encoded', false);
  await client.setAccountStatus('id/encoded', false);
  assert.equal(calls[1].init.method, 'PUT');
  assert.equal(calls[1].init.body, '{"active":false}');
  assert.equal(calls[1].init.body, calls[2].init.body);
  assert.match(calls[1].url, /id%2Fencoded\/status$/);
  assert.equal(calls[1].init.credentials, 'include');
});
test('HTTP errors and malformed list are visible', async () => {
  for (const status of [401, 403, 409, 500]) {
    await assert.rejects(api(async () => Response.json({ message: 'Conflict' }, { status })).setAccountStatus('id', false));
  }
  await assert.rejects(api(async () => Response.json({})).searchAccounts({}), /không hợp lệ/);
});
