import React from 'react';

export const FeaturesSection: React.FC = () => {
  return (
    <section className="w-full py-20 px-margin" id="features">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <div className="text-center max-w-2xl mb-16">
          <p className="font-label-sm text-xs uppercase tracking-widest text-primary font-bold mb-space-xs">Giải pháp học tập 4-trong-1</p>
          <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-on-surface">
            Công Nghệ AI Định Hình Lối Học Tương Lai
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">
            Thiết kế chuẩn hóa dành riêng cho học sinh Việt Nam theo sát giáo trình bộ GD&ĐT.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg w-full">
          {/* Feature 1 */}
          <div className="group relative bg-surface-container-low hover:bg-surface-container p-space-xl rounded-2xl transition-all shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md mb-space-lg">
                <span className="material-symbols-outlined text-2xl">menu_book</span>
              </div>
              <span className="font-label-sm text-xs font-semibold text-primary uppercase tracking-wide">Trí tuệ kiến thức</span>
              <h3 className="font-headline-lg text-xl sm:text-2xl font-semibold text-on-surface mt-space-xs mb-space-sm">
                Hỏi đáp chuẩn SGK, triệt tiêu ảo giác
              </h3>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                Mô hình RAG liên kết trực tiếp với dữ liệu Sách giáo khoa (Kết Nối Tri Thức, Cánh Diều, Chân Trời Sáng Tạo). Mọi câu trả lời đều trích dẫn chính xác bài, trang và định nghĩa nguồn.
              </p>
            </div>
            <div className="mt-space-lg pt-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-xs">
              <div className="flex items-center gap-space-sm text-xs text-on-surface-variant font-mono">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span>Trích dẫn: SGK Vật lý 11 • Trang 48 Mục II.3</span>
              </div>
            </div>
          </div>
          
          {/* Feature 2 */}
          <div className="group relative bg-surface-container-low hover:bg-surface-container p-space-xl rounded-2xl transition-all shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shadow-md mb-space-lg">
                <span className="material-symbols-outlined text-2xl">quiz</span>
              </div>
              <span className="font-label-sm text-xs font-semibold text-secondary uppercase tracking-wide">Đánh giá tức thì</span>
              <h3 className="font-headline-lg text-xl sm:text-2xl font-semibold text-on-surface mt-space-xs mb-space-sm">
                Luyện trắc nghiệm & sửa lỗi từng bước
              </h3>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                Tạo đề thi trắc nghiệm linh hoạt từ 5 đến 40 câu theo đúng cấu trúc đề tốt nghiệp. AI tự động phát hiện lỗ hổng tư duy và chỉ rõ bước sai cụ thể thay vì chỉ đưa ra đáp án cuối cùng.
              </p>
            </div>
            <div className="mt-space-lg pt-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-on-surface mb-1">
                <span>Độ hoàn thiện đề thử nghiệm 15 câu</span>
                <span className="text-primary">12/15 (80%)</span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full w-4/5"></div>
              </div>
            </div>
          </div>
          
          {/* Feature 3 */}
          <div className="group relative bg-surface-container-low hover:bg-surface-container p-space-xl rounded-2xl transition-all shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary-fixed/20 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-center shadow-md mb-space-lg">
                <span className="material-symbols-outlined text-2xl">local_fire_department</span>
              </div>
              <span className="font-label-sm text-xs font-semibold text-tertiary uppercase tracking-wide">Động lực học tập</span>
              <h3 className="font-headline-lg text-xl sm:text-2xl font-semibold text-on-surface mt-space-xs mb-space-sm">
                Tích lũy XP & duy trì chuỗi Streak
              </h3>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                Biến việc học hằng ngày thành một hành trình thú vị. Đạt chuỗi ngày liên tiếp, mở khóa huy hiệu danh hiệu và đổi quà học tập ý nghĩa, giúp việc tự học không còn nhàm chán.
              </p>
            </div>
            <div className="mt-space-lg pt-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-tertiary text-2xl animate-pulse">whatshot</span>
                <div>
                  <p className="text-xs font-bold text-on-surface">Chuỗi 18 ngày kiên trì</p>
                  <p className="text-xs text-on-surface-variant">Bảo vệ chuỗi thành công</p>
                </div>
              </div>
              <span className="px-space-sm py-1 bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold rounded-lg">+350 Điểm</span>
            </div>
          </div>
          
          {/* Feature 4 */}
          <div className="group relative bg-surface-container-low hover:bg-surface-container p-space-xl rounded-2xl transition-all shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/20 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-highest text-primary flex items-center justify-center shadow-sm mb-space-lg">
                <span className="material-symbols-outlined text-2xl">insights</span>
              </div>
              <span className="font-label-sm text-xs font-semibold text-primary uppercase tracking-wide">Cá nhân hóa</span>
              <h3 className="font-headline-lg text-xl sm:text-2xl font-semibold text-on-surface mt-space-xs mb-space-sm">
                Báo cáo năng lực & đồng hành giáo viên
              </h3>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                Biểu đồ phân tích chuyên sâu các vùng kiến thức yếu cần củng cố. Tích hợp cổng quản lý cho giáo viên và phụ huynh dễ dàng nắm bắt sự tiến bộ thực tế mà không gây áp lực.
              </p>
            </div>
            <div className="mt-space-lg pt-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-on-surface-variant">Điểm năng lực tổng quát</span>
                <span className="text-base font-bold text-primary">8.8 / 10.0 (+1.4 điểm)</span>
              </div>
              <svg className="w-24 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 100 30">
                <path d="M0 25 Q 25 22, 40 15 T 70 12 T 100 4"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
