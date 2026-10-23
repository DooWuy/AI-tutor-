// Synthetic account, isolated preview server and API. Never connects to the application's backend.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/context/AuthContext';
import { ToastProvider } from '../../src/context/ToastContext';
import { NotificationProvider } from '../../src/context/NotificationContext';
import { NotificationBell } from '../../src/components/common/NotificationBell';
import '../../src/index.css';

const query = new URLSearchParams(window.location.search);
const role = ['STUDENT', 'TEACHER', 'ADMIN'].includes(query.get('role') || '') ? query.get('role')! : 'STUDENT';
localStorage.setItem('ai-tutor.access-token', 'notification-preview-only');
localStorage.setItem('ai-tutor.user', JSON.stringify({ userId: '00000000-0000-4000-8000-000000000001', role,
  username: 'preview', fullName: 'Tài khoản kiểm thử', email: 'preview@example.invalid' }));
document.documentElement.classList.toggle('dark', query.get('theme') === 'dark');

const preview = <React.StrictMode><MemoryRouter><AuthProvider><ToastProvider><NotificationProvider>
  <div className="min-h-screen bg-surface text-on-surface">
    <header className="flex h-16 items-center justify-between border-b border-outline-variant px-4">
      <strong>AI Tutor · {role}</strong><NotificationBell />
    </header>
    <main className="p-6"><h1 className="text-xl font-semibold">Kiểm thử chuông thông báo</h1>
      <p className="mt-2 text-on-surface-variant">Dữ liệu mẫu. Không kết nối tài khoản hoặc dịch vụ thật.</p></main>
  </div>
</NotificationProvider></ToastProvider></AuthProvider></MemoryRouter></React.StrictMode>;
const viewport = query.get('viewport');
const framed = viewport && !query.has('framed');
const source = new URL(window.location.href); source.searchParams.set('framed', '1');
createRoot(document.getElementById('root')!).render(framed
  ? <iframe title="Responsive notification fixture" src={source.href} style={{ width: viewport === 'mobile' ? 375 : 812,
      height: viewport === 'mobile' ? 812 : 375, border: '1px solid #c1c6d5', margin: 16 }} /> : preview);
