import React from 'react';
import { Link } from 'react-router-dom';

export const LandingHeader: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
      <div className="h-20 max-w-7xl mx-auto px-margin flex items-center justify-between">
        <Link to="/" className="flex items-center gap-space-sm cursor-pointer">
          <img 
            alt="AI Tutor Logo" 
            className="h-8 w-auto object-contain" 
            src="https://lh3.googleusercontent.com/aida/AEtjO1UkI5g-Uaqq8t2YJYNnyTlK2zqgw03-kkPdwv0OvUyqdVq7fWLfwNIzKUFf7n2hRe6E-pufaaXyYZBqZNh0hziW3Dk1IAa_MrHhLT038MCUNWwrAi8S059jHaTtOQYgnCoG32UzRCFKXNcrbXPQ61iQeXffVraTfLNc6kygG4Nard6nM2jvdCkc6EZtjYAiv5djqccxHtxr1Senx0iFeEB40Hj8QtnPcaLu-141g2IQ9BaqHomSN8PSTF0"
          />
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
