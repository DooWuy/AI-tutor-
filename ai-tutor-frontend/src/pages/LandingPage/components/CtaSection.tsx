import React from 'react';
import { Link } from 'react-router-dom';

export const CtaSection: React.FC = () => {
  return (
    <section className="w-full py-20 px-margin">
      <div className="max-w-5xl mx-auto relative rounded-3xl bg-primary text-on-primary p-space-xl sm:p-16 overflow-hidden shadow-xl text-center">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-primary-container/30 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="px-space-md py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider text-primary-fixed inline-block mb-space-md">
            Khởi động ngay trong 30 giây
          </span>
          <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold tracking-tight mb-space-md">
            Sẵn Sàng Bứt Phá Điểm Số Ngay Hôm Nay?
          </h2>
          <p className="font-body-md text-primary-fixed text-sm sm:text-base leading-relaxed mb-space-xl">
            Đăng ký miễn phí, kết nối ngay với trợ lý AI riêng của bạn và trải nghiệm phong cách học tập chủ động, thông minh và đầy hứng khởi.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-space-md">
            <Link to="/register" className="w-full sm:w-auto inline-flex items-center justify-center px-space-xl py-space-md rounded-xl font-body-md font-semibold text-primary bg-surface-container-lowest shadow-md hover:bg-surface-container-low transition-all">
              <span>Tạo tài khoản miễn phí</span>
              <span className="material-symbols-outlined ml-space-xs text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
