import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const require = createRequire(import.meta.url);
function components(learning = {}) {
  const source = readFileSync(new URL('../src/pages/Student/Progress/ProgressComponents.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const context = createContext({ exports: {}, require: path => {
    if (path.endsWith('.css')) return {};
    if (path.includes('StudentLearningContext')) return { useStudentLearning: () => learning };
    if (path.includes('gamificationApi')) return { GamificationApiError: Error };
    return require(path);
  } });
  runInContext(compiled, context);
  return context.exports;
}
const render = component => renderToStaticMarkup(React.createElement(MemoryRouter, null, component));
test('loading announces status while error announces alert and offers retry', () => {
  const { ResourceState } = components();
  const waiting = render(React.createElement(ResourceState, { resource: { loading:true }, retry() {}, label:'tiến độ' }));
  assert.match(waiting, /role="status"/); assert.match(waiting, /Đang tải tiến độ/);
  const failed = render(React.createElement(ResourceState, { resource: { loading:false,error:new Error('Kết nối gián đoạn') }, retry() {}, label:'tiến độ' }));
  assert.match(failed, /role="alert"/); assert.match(failed, /Kết nối gián đoạn/); assert.match(failed, /Thử lại/);
  assert.doesNotMatch(failed, /0 XP/);
});
test('me outside top is visible without inserting a fictitious top entry', () => {
  const data = { generatedAt:'2026-10-16T00:00:00Z', entries:[{rank:1,displayName:'Bạn học',avatarUrl:null,totalXp:500,currentLevel:6}], me:{rank:25,displayName:'Tôi',avatarUrl:null,totalXp:100,currentLevel:2} };
  const { LeaderboardCard } = components({GLOBAL:{data,loading:false,error:null},refresh(){}});
  const html=render(React.createElement(LeaderboardCard));
  assert.match(html, /#25/); assert.match(html,/Vị trí của bạn/); assert.match(html,/Toàn hệ thống/);
  assert.equal((html.match(/<li>/g)||[]).length,1); assert.match(html,/aria-pressed="true"/);
});
test('recent quizzes empty state offers an actionable practice route', () => {
  const { RecentQuizzes } = components();
  const html=render(React.createElement(RecentQuizzes,{data:{recentQuizzes:[]}}));
  assert.match(html,/Hành trình đang chờ bạn/); assert.match(html,/href="\/student\/practice"/);
  assert.doesNotMatch(html,/quiz-results/);
});
