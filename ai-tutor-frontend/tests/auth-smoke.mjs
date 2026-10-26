// Run against the local Docker stack: node tests/auth-smoke.mjs
// Creates one clearly named QA student account, leaving existing accounts intact.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const base = process.env.AUTH_SMOKE_BASE_URL || 'http://localhost:3000/api/v1';
const username = `qa_auth_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
const password = `Qa!${randomUUID()}`;
let cookies = new Map();
let checks = 0;

async function request(path, body, expectedStatus, authenticated = false) {
  const res = await fetch(`${base}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json',
      ...(authenticated ? { Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; ') } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(res.status, expectedStatus, `${path}: expected ${expectedStatus}, received ${res.status}`);
  assert.match(res.headers.get('content-type') || '', /application\/json/, `${path}: backend JSON response required`);
  for (const cookie of res.headers.getSetCookie()) {
    const [name, ...value] = cookie.split(';')[0].split('=');
    cookies.set(name, value.join('='));
  }
  const payload = await res.json();
  if (expectedStatus < 400) assert.equal(payload.success, true, path);
  else assert.notEqual(payload.success, true, path);
  checks++;
  console.log(`PASS ${path} -> ${res.status}`);
  return payload;
}

const data = { username, email: `${username}@example.invalid`, password, confirmPassword: password,
  fullName: 'QA Auth Smoke', phoneNumber: '0912345678', schoolName: 'QA School', gradeLevel: '5', className: '5A' };

await request('/auth/login', { email: username, password: 'wrong' }, 401);
await request('/auth/register', { ...data, phoneNumber: '' }, 400);
const registered = await request('/auth/register', data, 201);
assert.ok(registered.data.accessToken);
assert.equal(registered.data.user.role, 'STUDENT');
assert.ok(cookies.get('access_token'));
assert.ok(cookies.get('refresh_token'));
const userId = registered.data.user.userId;
await request(`/users/${userId}`, undefined, 200, true);
await request('/auth/register', data, 409);
await request('/auth/logout', {}, 200, true);
await request('/auth/login', { email: data.email, password }, 200);
await request(`/users/${userId}`, undefined, 200, true);
await request('/auth/logout', {}, 200, true);
await request(`/users/${userId}`, undefined, 401, true);
await request('/auth/login', { email: username, password }, 200);
const oldRefreshToken = cookies.get('refresh_token');
await request('/auth/refresh', {}, 200, true);
assert.notEqual(cookies.get('refresh_token'), oldRefreshToken, 'Rotation must issue a unique refresh token');
await request(`/users/${userId}`, undefined, 200, true);
await request('/auth/logout', {}, 200, true);
console.log(`${checks} checks passed through ${base}; QA account: ${username}; userId: ${userId}`);
