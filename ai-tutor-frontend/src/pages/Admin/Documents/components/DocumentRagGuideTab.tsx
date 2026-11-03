import React from 'react';
import {
  Sparkles,
  Search,
  ShieldCheck,
  Cpu,
  Layers,
  Info,
} from 'lucide-react';

export const DocumentRagGuideTab: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Tải lên & Xác thực an toàn',
      desc: 'Tệp được kiểm tra chữ ký định dạng (PDF, DOCX, TXT, MD), dung lượng tối đa 50MB, làm sạch tên tệp để ngăn path-traversal.',
      icon: ShieldCheck,
      color: 'blue',
    },
    {
      num: '02',
      title: 'Hàng đợi RabbitMQ & OCR',
      desc: 'Tài liệu vào trạng thái PROCESSING. Tiến trình worker bóc tách nội dung, áp dụng OCR nhận dạng chữ viết và công thức khoa học.',
      icon: Cpu,
      color: 'amber',
    },
    {
      num: '03',
      title: 'Semantic Chunking & Embedding',
      desc: 'Nội dung được chia thành các đoạn văn bản (DocumentChunk) có kích thước chuẩn và tạo vector nhúng 1024 chiều.',
      icon: Layers,
      color: 'purple',
    },
    {
      num: '04',
      title: 'Kích hoạt Tra cứu AI (SUCCESS)',
      desc: 'Chỉ các tài liệu SUCCESS mới được kích hoạt tìm kiếm tương đồng vector (Cosine similarity) để AI Tutor trả lời học sinh có trích dẫn nguồn.',
      icon: Search,
      color: 'emerald',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 text-on-surface">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-on-primary shadow-sm">
            <Sparkles size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold">
              Kiến trúc RAG (Retrieval-Augmented Generation) trong AI Tutor
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-4xl">
              Kho tài liệu và sách là nguồn tri thức nền tảng (Grounding Source) để AI Tutor giải thích bài tập, giải đáp câu hỏi và tạo bài kiểm tra. Hệ thống đảm bảo mọi thông tin do trợ lý AI trả lời đều có trích dẫn nguồn học liệu chính thống từ giáo viên và nhà trường.
            </p>
          </div>
        </div>
      </div>

      {/* Step by Step Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="relative rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-black text-on-surface-variant/40">
                    {step.num}
                  </span>
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-container text-primary border border-outline-variant">
                    <Icon size={18} />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-on-surface mb-2">{step.title}</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Principles */}
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 space-y-4">
        <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <Info size={16} className="text-primary" />
          Quy chuẩn vận hành & Bảo mật dữ liệu
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-on-surface-variant">
          <div className="rounded-xl border border-outline-variant/60 bg-surface p-4 space-y-1.5">
            <span className="font-bold text-on-surface block">Kiểm soát truy cập (RBAC)</span>
            <p className="leading-relaxed">
              Quản trị viên có toàn quyền kiểm soát mọi tài liệu hệ thống. Giáo viên chỉ quản lý các tài liệu do chính mình tạo ra.
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/60 bg-surface p-4 space-y-1.5">
            <span className="font-bold text-on-surface block">Đồng bộ Metadata đa tầng</span>
            <p className="leading-relaxed">
              Mỗi khi cập nhật tiêu đề, môn học hay khối lớp, toàn bộ các vector chunk liên kết được đồng bộ trong cùng một transaction cơ sở dữ liệu.
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/60 bg-surface p-4 space-y-1.5">
            <span className="font-bold text-on-surface block">Xóa tài liệu an toàn</span>
            <p className="leading-relaxed">
              Khi xóa tài liệu, các vector trong cơ sở dữ liệu vector sẽ lập tức bị hủy để dừng tra cứu, trong khi lịch sử chat của học sinh vẫn được lưu giữ toàn vẹn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
