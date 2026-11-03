import test from 'node:test';
import assert from 'node:assert/strict';
import { tsLoader } from './helpers/loadTs.mjs';
test('teacher API contract uses dedicated endpoints and auth', async () => {
 let requests=[];let fail=false;
 const load=tsLoader({mocks:{authApi:{getStoredSession:()=>({accessToken:'token'})}},globals:{fetch:async(url,init)=>{requests.push([url,init]);return{ok:!fail,status:fail?400:200,json:async()=>fail?{message:'Invalid',error:{department:'Required'}}:{success:true,data:{userId:'teacher'}}};}}});
 const api=load('src/services/adminUserApi.ts');
 await api.createTeacher({username:'alice',email:'alice@test.invalid',fullName:'Alice',department:'Science',subjectTaught:'Math',schoolName:''});
 await api.getAccount('teacher'); await api.updateTeacher('teacher',{fullName:'New name'}); await api.resendInvitation('teacher');
 assert.ok(requests[0][0].endsWith('/users/teachers')); assert.ok(requests[3][0].endsWith('/teacher/invitation/resend'));
 assert.ok(requests.every(([,r])=>r.credentials==='include'&&r.headers.Authorization==='Bearer token'));
 fail=true; await assert.rejects(api.createTeacher({}), e=>e.fields.department==='Required');
});
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';

test('teacher form creates separate identities, edits only allowed fields and exposes resend errors', async () => {
 const dom=new JSDOM('<div id="root"></div>',{url:'http://test/admin/users'});
 const previous={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
 dom.window.HTMLElement.prototype.attachEvent=function(){};
 dom.window.HTMLElement.prototype.detachEvent=function(){};
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 let created=[],updates=[],closed=0,resendFail=true;
 const load=tsLoader({mocks:{adminUserApi:{AccountError:class extends Error{},
  createTeacher:async input=>{created.push(input);return input;},
  getAccount:async()=>({userId:'a',username:'alice',email:'alice@test.invalid',fullName:'Alice Teacher',department:'Science',subjectTaught:'Math',teacherCode:'TEA-A',active:false,invitationStatus:'FAILED'}),
  updateTeacher:async(id,input)=>{updates.push(input);return input;},
  resendInvitation:async()=>{if(resendFail)throw new Error('Wait 60 seconds');return{userId:'a',teacherCode:'TEA-A',active:false,invitationStatus:'QUEUED'};}
 }},globals:{window:dom.window}});
 const {TeacherForm}=load('src/pages/Admin/Users/TeacherForm.tsx');const root=createRoot(document.getElementById('root'));
 const render=async id=>{await act(async()=>root.render(React.createElement(TeacherForm,{key:id,id,onClose:()=>closed++,onSaved:()=>{}})));};
 const click=async label=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent===label);assert.ok(button,label);await act(async()=>button.click());};
 const set=async(k,value)=>{const input=document.getElementById('teacher-'+k);const key=Object.keys(input).find(k=>k.startsWith('__reactProps'));await act(async()=>input[key].onChange({target:{value}}));};
 try {
  await render('new');assert.ok(document.querySelector('dialog').open);
  await click('Lưu giáo viên');assert.match(document.body.textContent,/Không được để trống/);assert.equal(created.length,0);
  for(const name of ['Alice','Bob']) {
   for(const [k,v] of Object.entries({username:name,email:name+'@test.invalid',fullName:name+' Teacher',department:'Science',subjectTaught:'Math'}))await set(k,v);
   await click('Lưu giáo viên');
  }
  assert.equal(created.length,2);assert.notEqual(created[0].username,created[1].username);assert.equal(closed,2);
  assert.ok(created.every(c=>!('password'in c)&&!('role'in c)));
  await render('a');assert.match(document.body.textContent,/TEA-A/);assert.match(document.body.textContent,/Đang khóa/);
  assert.ok(document.getElementById('teacher-email').readOnly);assert.ok(document.getElementById('teacher-username').readOnly);
  await click('Gửi lại email thiết lập');assert.match(document.body.textContent,/Wait 60 seconds/);
  resendFail=false;await click('Gửi lại email thiết lập');assert.match(document.body.textContent,/Đang chờ gửi email/);assert.match(document.body.textContent,/Đang khóa/);
  await set('subjectTaught','History');await click('Lưu giáo viên');assert.equal(updates[0].subjectTaught,'History');assert.ok(!('email'in updates[0])&&!('username'in updates[0]));
 } finally {await act(async()=>root.unmount());dom.window.close();Object.assign(globalThis,previous);}
});
