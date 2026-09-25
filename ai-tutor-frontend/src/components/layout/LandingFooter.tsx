import React from 'react';
import { Link } from 'react-router-dom';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="w-full bg-surface-container-low border-t border-outline-variant/30 py-space-xl">
      <div className="max-w-7xl mx-auto px-margin flex flex-col md:flex-row items-center justify-between gap-space-md text-xs text-on-surface-variant">
        <div className="flex items-center gap-space-sm">
          <span className="font-headline-lg text-sm font-semibold text-on-surface">AI Tutor</span>
          <span>• Nền tảng học tập thông minh</span>
        </div>
        <div className="flex items-center gap-space-lg">
          <Link to="/" className="hover:text-on-surface transition-colors">Trang chủ</Link>
          <a href="#features" className="hover:text-on-surface transition-colors">Tính năng</a>
          <a href="#pricing" className="hover:text-on-surface transition-colors">Bảng giá</a>
          <Link to="/login" className="hover:text-on-surface transition-colors">Đăng nhập</Link>
          <Link to="/register" className="hover:text-on-surface transition-colors">Đăng ký</Link>
        </div>
        <p>© 2026 AI Tutor Inc. Bảo lưu mọi quyền.</p>
      </div>
    </footer>
  );
};
