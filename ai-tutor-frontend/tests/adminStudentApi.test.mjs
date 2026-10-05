import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';

// Execute the actual service with a transport stub; no backend credentials needed.
const source = readFileSync(new URL('../src/services/adminStudentApi.ts', import.meta.url), 'utf8');
function setup(transport, base = 'https://api.example.test/api/v1/') {
  const compiled = ts.transpileModule(source.replace('import.meta.env.VITE_API_BASE_URL', JSON.stringify(base)), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = createContext({ exports: {}, fetch: transport, URLSearchParams });
  runInContext(compiled, context);
  return context.exports;
}
const response = (payload, status = 200) => new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });

test('server-side filters preserve active=false, Unicode, UUID and 1-based pagination', async () => {
  const api = setup(async (url, init) => {
    const parsed = new URL(url);
    assert.equal(parsed.pathname, '/api/v1/admin/students');
    assert.equal(parsed.searchParams.get('active'), 'false');
    assert.equal(parsed.searchParams.get('search'), 'Nguyễn & An');
    assert.equal(parsed.searchParams.get('classId'), 'class-uuid');
    assert.equal(parsed.searchParams.get('schoolName'), 'Trường A');
    assert.equal(parsed.searchParams.get('gradeLevel'), '8');
    assert.equal(parsed.searchParams.get('page'), '2');
    assert.equal(parsed.searchParams.get('size'), '50');
    assert.equal(parsed.searchParams.get('sort'), 'totalXp');
    assert.equal(parsed.searchParams.get('direction'), 'desc');
    assert.equal(init.credentials, 'include');
    return response({ content: [], page: 2, size: 50, totalElements: 60, totalPages: 2, hasNext: false, hasPrevious: true });
  });
  const page = await api.fetchStudents({ active: false, search: 'Nguyễn & An', schoolName: 'Trường A', gradeLevel: '8', classId: 'class-uuid', page: 2, size: 50, sort: 'totalXp', direction: 'desc' });
  assert.equal(page.page, 2);
  assert.equal(page.totalElements, 60);
});

test('blank and undefined filters are omitted', async () => {
  const api = setup(async url => { assert.equal(url, 'https://api.example.test/api/v1/admin/students'); return response({ content: [] }); });
  await api.fetchStudents({ search: '', active: undefined });
});

test('all wrapped endpoints preserve method, payload and cookie authentication', async () => {
  const calls = [];
  const api = setup(async (url, init) => { calls.push({ url, init }); return response({ success: true, data: { studentId: 'id' } }); });
  await api.fetchStudentDetail('id/encoded');
  await api.createStudent({ username: 'student' });
  await api.updateStudent('id', { fullName: 'Student' });
  await api.toggleStudentStatus('id');
  await api.deleteStudent('id');
  assert.deepEqual(calls.map(call => call.init.method || 'GET'), ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  assert.ok(calls[0].url.endsWith('/id%2Fencoded'));
  assert.ok(calls[3].url.endsWith('/id/status'));
  assert.equal(JSON.parse(calls[2].init.body).fullName, 'Student');
  assert.ok(calls.every(call => call.init.credentials === 'include'));
});

test('validation response retains field errors and HTTP status', async () => {
  const api = setup(async () => response({ success: false, error: { email: 'Email đã tồn tại.' } }, 409));
  await assert.rejects(api.createStudent({}), error => error.status === 409 && error.fieldErrors.email === 'Email đã tồn tại.');
});

test('unauthorized and forbidden responses are surfaced', async () => {
  for (const status of [401, 403]) {
    const api = setup(async () => new Response('', { status }));
    await assert.rejects(api.fetchStudents(), error => error.status === status && Boolean(error.message));
  }
});

test('list rejects wrong response envelope and malformed JSON', async () => {
  for (const body of ['{"success":true,"data":[]}', 'invalid json']) {
    const api = setup(async () => new Response(body, { headers: { 'Content-Type': 'application/json' } }));
    await assert.rejects(api.fetchStudents(), /Phản hồi danh sách học sinh không hợp lệ/);
  }
});

test('network failures have a distinct error status', async () => {
  const api = setup(async () => { throw new TypeError('Network failure'); });
  await assert.rejects(api.fetchStudents(), error => error.status === 0);
});

test('request cancellation is preserved instead of converted to a network error', async () => {
  const controller = new AbortController();
  controller.abort();
  const aborted = new DOMException('Aborted', 'AbortError');
  const api = setup(async (_url, init) => { assert.equal(init.signal, controller.signal); throw aborted; });
  await assert.rejects(api.fetchStudents({}, controller.signal), error => error === aborted);
});
