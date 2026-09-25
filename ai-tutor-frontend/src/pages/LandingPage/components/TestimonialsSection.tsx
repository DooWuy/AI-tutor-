import React from 'react';

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="w-full bg-surface-container-low py-16 px-margin">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="font-label-sm text-xs uppercase text-primary font-bold tracking-wider">Cảm nhận từ học sinh</span>
          <h3 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface mt-1">Được kiểm chứng bởi thế hệ Gen Z</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          {/* Review 1 */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div className="space-y-space-sm">
              <div className="flex text-tertiary">
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              </div>
              <p className="font-body-md text-xs text-on-surface leading-relaxed">
                "Trước đây mình rất sợ giải phần Tích phân lớp 12, nhưng tính năng giải thích từng bước của AI Tutor giúp mình hiểu bản chất bài học rõ rệt."
              </p>
            </div>
            <div className="mt-space-md pt-space-xs flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-xs font-bold">
                HN
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface">Hoàng Nam</p>
                <p className="text-xs text-on-surface-variant">Lớp 12 - THPT Chuyên Hà Nội</p>
              </div>
            </div>
          </div>
          
          {/* Review 2 */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div className="space-y-space-sm">
              <div className="flex text-tertiary">
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              </div>
              <p className="font-body-md text-xs text-on-surface leading-relaxed">
                "Tài liệu hoàn toàn bám sát bộ SGK Cánh Diều trường mình đang học. Không hề bị câu trả lời chung chung lan man như các AI khác."
              </p>
            </div>
            <div className="mt-space-md pt-space-xs flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center text-xs font-bold">
                MA
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface">Minh Anh</p>
                <p className="text-xs text-on-surface-variant">Lớp 11 - THPT Lê Hồng Phong</p>
              </div>
            </div>
          </div>
          
          {/* Review 3 */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div className="space-y-space-sm">
              <div className="flex text-tertiary">
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              </div>
              <p className="font-body-md text-xs text-on-surface leading-relaxed">
                "Hệ thống tích điểm XP và chuỗi streak làm việc học mỗi tối vui như một trò chơi thú vị. Mình đã duy trì chuỗi 30 ngày liên tục!"
              </p>
            </div>
            <div className="mt-space-md pt-space-xs flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-xs font-bold">
                QK
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface">Quốc Khánh</p>
                <p className="text-xs text-on-surface-variant">Lớp 10 - THPT Thăng Long</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
