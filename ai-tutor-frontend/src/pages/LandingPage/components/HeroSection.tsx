import React from 'react';
import { Link } from 'react-router-dom';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative w-full overflow-hidden py-16 lg:py-24 px-margin">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[620px] h-[320px] bg-primary-container/15 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute top-48 right-12 w-72 h-72 bg-secondary-container/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-space-xs px-space-md py-1 bg-surface-container rounded-full shadow-sm mb-space-lg">
          <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="font-label-sm text-label-sm text-primary font-semibold tracking-wide uppercase">Gia sư AI thế hệ mới chuẩn SGK</span>
        </div>
        
        <h1 className="font-headline-lg text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface max-w-4xl leading-tight sm:leading-none">
          Học Tập Chủ Động & Tiến Bộ Vượt Bậc Cùng <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-8">AI Tutor</span>
        </h1>
        
        <p className="mt-space-lg max-w-2xl font-body-md text-body-md text-on-surface-variant leading-relaxed">
          Giải đáp không ảo giác dựa trên sách giáo khoa hiện hành, tạo bài tập tự động, tích lũy điểm thưởng <span className="font-semibold text-primary">+XP</span> và theo dõi tiến trình học tập thông minh mỗi ngày.
        </p>
        
        <div className="mt-space-xl flex flex-wrap items-center justify-center gap-space-md">
          <Link to="/register" className="inline-flex items-center gap-space-sm px-space-xl py-space-md rounded-xl font-body-md font-semibold text-on-primary bg-primary shadow-lg shadow-primary/25 hover:bg-primary-container hover:shadow-primary/40 transition-all cursor-pointer">
            <span>Bắt đầu học thử miễn phí</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
          <a href="#features" className="inline-flex items-center gap-space-sm px-space-xl py-space-md rounded-xl font-body-md font-medium text-on-surface bg-surface-container hover:bg-surface-container-high transition-all cursor-pointer">
            <span className="material-symbols-outlined text-lg text-primary">play_circle</span>
            <span>Khám phá tính năng</span>
          </a>
        </div>
        
        <div className="mt-space-lg flex items-center justify-center gap-space-sm text-on-surface-variant font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-base text-primary">verified_user</span>
          <span>Không yêu cầu thẻ thanh toán • Truy cập 24/7 trên mọi thiết bị</span>
        </div>
        
        <div className="relative w-full max-w-4xl mt-14">
          <div className="absolute -top-6 -right-2 sm:right-6 z-20 flex items-center gap-space-xs bg-tertiary text-on-tertiary px-space-md py-space-xs rounded-full shadow-lg animate-bounce">
            <span className="material-symbols-outlined text-sm">stars</span>
            <span className="font-label-sm font-bold tracking-wider">+50 XP Thưởng</span>
          </div>
          
          <div className="w-full bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden text-left p-space-lg sm:p-space-xl">
            <div className="flex items-center justify-between pb-space-md mb-space-lg">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
                  <span className="material-symbols-outlined text-lg">neurology</span>
                </div>
                <div>
                  <p className="font-label-sm text-on-surface font-semibold">Trợ lý AI Khoa Học Tự Nhiên</p>
                  <p className="font-label-sm text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Trực tuyến • Sẵn sàng giải bài
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="px-space-sm py-0.5 rounded bg-surface-container text-on-surface-variant text-xs font-medium">Toán Lớp 10</span>
                <span className="px-space-sm py-0.5 rounded bg-primary-fixed text-on-primary-fixed text-xs font-semibold">Bộ Cánh Diều</span>
              </div>
            </div>
            
            <div className="space-y-space-md">
              <div className="flex items-start justify-end gap-space-sm">
                <div className="bg-primary text-on-primary rounded-2xl rounded-tr-none px-space-lg py-space-sm max-w-lg shadow-sm">
                  <p className="font-body-md text-sm">Gia sư ơi, giải thích giúp mình định lý Cosin trong tam giác bất kỳ và điều kiện áp dụng với?</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-xs font-semibold">EM</div>
              </div>
              
              <div className="flex items-start gap-space-sm">
                <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center shadow-xs shrink-0">
                  <span className="material-symbols-outlined text-base">smart_toy</span>
                </div>
                <div className="bg-surface-container-low text-on-surface rounded-2xl rounded-tl-none p-space-md max-w-2xl shadow-sm">
                  <p className="font-body-md text-sm leading-relaxed mb-space-sm">
                    Chào em! Trong tam giác ABC với các cạnh đối diện các góc lần lượt là a, b, c:
                  </p>
                  <div className="bg-surface-container px-space-md py-space-sm rounded-lg font-mono text-xs text-primary font-medium mb-space-sm">
                    a² = b² + c² - 2bc · cos(A)
                  </div>
                  <p className="font-body-md text-xs text-on-surface-variant mb-space-md">
                    💡 <span className="font-semibold text-on-surface">Ứng dụng:</span> Áp dụng khi biết <span className="text-primary font-medium">2 cạnh + 1 góc xen giữa</span> hoặc biết <span className="text-primary font-medium">cả 3 cạnh</span> để tính góc còn lại (SGK Hình học 10, Bài 2).
                  </p>
                  
                  <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-xs">
                    <div className="flex items-center justify-between mb-space-xs">
                      <span className="font-label-sm text-xs font-semibold text-primary uppercase">Câu hỏi tương tác nhanh</span>
                      <span className="text-xs text-on-surface-variant">Thử sức: 1 câu</span>
                    </div>
                    <p className="text-xs font-medium text-on-surface mb-space-sm">Nếu tam giác vuông tại A ($A = 90^\circ$), định lý Cosin biến đổi thành hệ thức nào?</p>
                    <div className="grid grid-cols-2 gap-space-xs text-xs">
                      <button className="text-left px-space-sm py-space-xs rounded bg-surface-container hover:bg-primary-fixed transition-colors font-medium text-on-surface">
                        A. Định lý Talet
                      </button>
                      <button className="text-left px-space-sm py-space-xs rounded bg-primary-fixed text-on-primary-fixed font-semibold transition-colors flex items-center justify-between">
                        <span>B. Định lý Pytago</span>
                        <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-space-lg pt-space-md flex items-center gap-space-sm bg-surface-container-low rounded-xl px-space-md py-space-xs">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">psychology</span>
              <input className="bg-transparent text-xs text-on-surface placeholder:text-on-surface-variant w-full focus:outline-none cursor-default" placeholder="Hỏi thêm về bài tập này, hoặc bấm để tạo bài kiểm tra 5 phút..." readOnly type="text"/>
              <button className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-base">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
