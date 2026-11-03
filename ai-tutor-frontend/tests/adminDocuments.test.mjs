import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {tsLoader} from './helpers/loadTs.mjs';
test('documents page loads empty, reports errors and retries',async()=>{
 const dom=new JSDOM('<div id="root"></div>');const old={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});let fail=false,requests=[];
 const load=tsLoader({mocks:{authApi:{getStoredSession:()=>({accessToken:'token'})}},globals:{window:dom.window,fetch:async(url,init)=>{requests.push({url,init});return{ok:!fail,json:async()=>fail?{message:'Offline'}:{content:[],totalElements:0,totalPages:0}};}}});
 const {DocumentsPage}=load('src/pages/Admin/DocumentsPage.tsx');const root=createRoot(document.getElementById('root'));
 try{await act(async()=>root.render(React.createElement(DocumentsPage)));assert.match(document.body.textContent,/Không có tài liệu/);assert.ok(requests[0].url.includes('/documents/page?page=1&size=20'));assert.equal(requests[0].init.headers.Authorization,'Bearer token');fail=true;await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Làm mới').click());assert.match(document.querySelector('[role="alert"]').textContent,/Offline/);fail=false;await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Thử lại').click());assert.equal(document.querySelector('[role="alert"]'),null);
 }finally{await act(async()=>root.unmount());assert.ok(requests.at(-1).init.signal.aborted);dom.window.close();Object.assign(globalThis,old);}
});
