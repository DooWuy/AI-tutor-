import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {tsLoader} from './helpers/loadTs.mjs';
test('quiz results use server pages, Admin links and retry without stale rows',async()=>{
 const dom=new JSDOM('<div id="root"></div>');const old={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});let calls=[],fail=false;
 const load=tsLoader({mocks:{'react-router-dom':{useParams:()=>({quizId:'quiz'}),Link:({to,children,...props})=>React.createElement('a',{href:to,...props},children)},assessmentUi:{useAssessmentBase:()=>'/admin',PrimaryButton:props=>React.createElement('button',props),ErrorBanner:({message})=>message?React.createElement('p',{role:'alert'},message):null},assessmentApi:{quizAdminApi:{statistics:async(id,page)=>{calls.push(page);if(fail)throw new Error('Offline');return{title:'Teacher Quiz',passingRate:50,passingScore:70,attemptCount:30,averageScore:80,students:[],hardestQuestions:[],totalElements:23,totalPages:2};}}}}});
 const {default:Page}=load('src/pages/Assessment/QuizStatisticsPage.tsx');const root=createRoot(document.getElementById('root'));const click=async text=>{await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent===text).click());};
 try{await act(async()=>root.render(React.createElement(Page)));assert.match(document.body.textContent,/Teacher Quiz/);assert.equal(document.querySelector('a').getAttribute('href'),'/admin/quizzes');await click('Sau');assert.equal(calls.at(-1),2);fail=true;await click('Trước');assert.match(document.body.textContent,/Offline/);assert.doesNotMatch(document.body.textContent,/Teacher Quiz/);fail=false;await click('Thử lại');assert.match(document.body.textContent,/Chưa có học sinh nộp bài/);}finally{await act(async()=>root.unmount());dom.window.close();Object.assign(globalThis,old);}
});
test('review and report API preserve auth and page number',async()=>{
 let requests=[];const load=tsLoader({mocks:{authApi:{getStoredSession:()=>({accessToken:'token'})}},globals:{fetch:async(url,init)=>{requests.push({url,init});return{ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>({success:true,data:{}})};}}});const {quizAdminApi}=load('src/services/assessmentApi.ts');await quizAdminApi.statistics('q',2);await quizAdminApi.review('q');assert.ok(requests[0].url.endsWith('/quizzes/q/report?page=2&size=20'));assert.equal(requests[1].init.method,'POST');assert.equal(requests[1].init.headers.Authorization,'Bearer token');
});
