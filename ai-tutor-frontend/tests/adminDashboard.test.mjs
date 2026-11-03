import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { tsLoader } from './helpers/loadTs.mjs';
const sample={totalUsers:30,totalDocuments:4,totalQuizzes:5,chatCount:6,attemptCount:7,updatedAt:'2026-11-02T00:00:00Z'};
test('dashboard API auth, cancellation, zero counts and malformed/error responses',async()=>{
 let request;let status=200;let data=sample;
 const loader=tsLoader({mocks:{authApi:{getStoredSession:()=>({accessToken:'token'})}},globals:{fetch:async(url,init)=>{request={url,init};return {ok:status===200,status,json:async()=>({success:true,data})};}}});
 const {fetchAdminDashboard}=loader('src/services/adminDashboardApi.ts');const signal=new AbortController().signal;
 assert.equal((await fetchAdminDashboard(signal)).totalUsers,30);assert.ok(request.url.endsWith('/dashboard/admin'));assert.equal(request.init.credentials,'include');assert.equal(request.init.cache,'no-store');assert.equal(request.init.headers.Authorization,'Bearer token');assert.equal(request.init.signal,signal);
 data={...sample,totalUsers:0};assert.equal((await fetchAdminDashboard()).totalUsers,0);
 for(const invalid of [null,{...sample,chatCount:-1},{...sample,totalUsers:'30'},{...sample,updatedAt:'bad'}]){data=invalid;await assert.rejects(fetchAdminDashboard(),/không hợp lệ/);}
 for(const code of [401,403,500]){status=code;await assert.rejects(fetchAdminDashboard());}
});
test('dashboard loading, actual counts, stale refresh failure, retry and empty state',async()=>{
 const dom=new JSDOM('<div id="root"></div>');const previous={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
 let resolve;let mode='pending';let calls=0;let lastSignal;
 const loader=tsLoader({mocks:{'react-router-dom':{Link:({to,children,...props})=>React.createElement('a',{href:to,...props},children)},adminDashboardApi:{fetchAdminDashboard:async(signal)=>{calls++;lastSignal=signal;if(mode==='pending')return new Promise(r=>resolve=r);if(mode==='error')throw new Error('Backend unavailable');return {...sample,totalUsers:0,totalDocuments:0,totalQuizzes:0,chatCount:0,attemptCount:0};}}}});
 const {AdminDashboardPage}=loader('src/pages/Admin/AdminDashboardPage.tsx');const root=createRoot(document.getElementById('root'));
 const click=async(text)=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===text);assert.ok(b);await act(async()=>b.click());};
 try{
  await act(async()=>root.render(React.createElement(AdminDashboardPage)));assert.match(document.body.textContent,/Đang tải tổng quan/);
  await act(async()=>resolve(sample));assert.deepEqual([...document.querySelectorAll('dd.text-4xl')].map(x=>x.textContent),['30','4','5','6','7']);assert.match(document.body.textContent,/07:00:00/);
  mode='error';await click('Làm mới');assert.match(document.querySelector('[role="alert"]').textContent,/chưa cập nhật/);assert.match(document.body.textContent,/Lần tải thành công trước/);assert.equal(document.querySelector('dd.text-4xl').textContent,'30');
  mode='empty';await click('Thử lại');assert.match(document.body.textContent,/Chưa có dữ liệu/);assert.equal(document.querySelector('dd.text-4xl').textContent,'0');assert.equal(document.querySelector('[role="alert"]'),null);assert.equal(calls,3);
  assert.ok([...document.querySelectorAll('a')].some(a=>a.getAttribute('href')==='/admin/users'));
 }finally{await act(async()=>root.unmount());assert.ok(lastSignal.aborted);dom.window.close();Object.assign(globalThis,previous);}
});
