import React from 'react';
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';

export const LandingHeader: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
      <div className="h-20 max-w-7xl mx-auto px-margin flex items-center justify-between">
        <Link to="/" className="flex items-center gap-space-sm cursor-pointer">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#004bb5] to-[#2575fc] text-white shadow-md shadow-[#005cb8]/20 ring-1 ring-white/20" aria-hidden="true">
            <Bot size={22} className="text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="font-headline-lg text-lg font-semibold tracking-tight text-on-surface flex items-center gap-space-xs">
            AI Tutor<span className="h-2 w-2 rounded-full bg-primary inline-block"></span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-space-lg text-sm">
          <Link to="/" className="transition-colors text-primary font-semibold">Trang chủ</Link>
          <a href="#features" className="text-on-surface-variant hover:text-on-surface transition-colors">Tính năng</a>
          <a href="#pricing" className="text-on-surface-variant hover:text-on-surface transition-colors">Bảng giá</a>
        </nav>
        <div className="flex items-center gap-space-md">
          <Link to="/login" className="text-sm font-medium text-on-surface-variant hover:text-on-surface px-space-md py-space-sm rounded transition-colors">
            Đăng nhập
          </Link>
          <Link to="/register" className="inline-flex items-center justify-center px-space-lg py-space-sm text-sm font-semibold text-on-primary bg-primary rounded-lg shadow-sm hover:bg-primary-container transition-all">
            Đăng ký
          </Link>
        </div>
      </div>
    </header>
  );
};
