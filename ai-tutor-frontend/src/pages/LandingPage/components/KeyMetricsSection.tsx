import React from 'react';

export const KeyMetricsSection: React.FC = () => {
  const metrics = [
    { title: "99.8%", label: "Chuẩn SGK Việt Nam", sub: "Khớp chương trình GDPT mới" },
    { title: "1.2s", label: "Phản hồi siêu tốc", sub: "Không độ trễ tư duy" },
    { title: "45,000+", label: "Học sinh & Sĩ tử", sub: "Ôn thi chuyển cấp & THPTQG" },
    { title: "15 Phút", label: "Làm chủ mỗi bài học", sub: "Phương pháp Microlearning" }
  ];

  return (
    <section className="w-full bg-surface-container-low py-12 px-margin">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-space-lg">
        {metrics.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center text-center p-space-md">
            <span className="font-headline-lg text-4xl lg:text-5xl font-bold text-primary">{item.title}</span>
            <span className="font-body-md text-sm font-semibold text-on-surface mt-space-xs">{item.label}</span>
            <span className="font-label-sm text-xs text-on-surface-variant mt-0.5">{item.sub}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
