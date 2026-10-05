import React, { useState, useRef } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');

export function TeachingMaterialsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !subject || !gradeLevel) {
      setMessage('Vui lòng điền đầy đủ Môn học, Khối lớp và chọn file PDF.');
      setIsSuccess(false);
      return;
    }

    setUploading(true);
    setMessage('');
    setIsSuccess(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject);
    formData.append('gradeLevel', gradeLevel);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/documents/ingest/pdf`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message || 'Tải lên thành công! Quá trình xử lý đang chạy ngầm.');
        setIsSuccess(true);
        setFile(null);
        setSubject('');
        setGradeLevel('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setMessage(data.message || 'Có lỗi xảy ra khi tải lên.');
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage('Lỗi kết nối đến máy chủ.');
      setIsSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Tài liệu giảng dạy</h1>
        <p className="text-sm text-slate-500">
          Quản lý giáo trình và sách giáo khoa. Tải lên file PDF để hệ thống AI tự động trích xuất mục lục và số hóa.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">upload_file</span>
          Tải lên sách giáo khoa (PDF)
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Môn học <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                placeholder="VD: Toán học"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Khối lớp <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                placeholder="VD: Lớp 5"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">File PDF <span className="text-red-500">*</span></label>
            <div className="relative">
              <input 
                type="file" 
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Dung lượng tối đa 50MB.</p>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${isSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <span className="material-symbols-outlined text-[18px]">
                {isSuccess ? 'check_circle' : 'error'}
              </span>
              <span>{message}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button 
              type="submit" 
              disabled={uploading}
              className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                  Tải lên & Số hóa
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
