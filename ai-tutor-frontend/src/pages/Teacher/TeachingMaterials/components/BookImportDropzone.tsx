import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { styles } from '../TeachingMaterialsPage.styles';
import {
  CURRICULUM_OPTIONS,
  type PendingUploadBook,
} from '../types/curriculum';

interface BookImportDropzoneProps {
  onFilesAdded: (newBooks: PendingUploadBook[]) => void;
  onError: (msg: string) => void;
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export function BookImportDropzone({ onFilesAdded, onError }: BookImportDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Smart guesser for title, subject, gradeLevel, curriculum
  const parseFileInfo = (file: File): PendingUploadBook => {
    let cleanName = file.name.replace(/\.pdf$/i, '').trim();

    // Guess subject
    let guessedSubject: string = 'Toán';
    if (cleanName.toLowerCase().includes('toán')) guessedSubject = 'Toán';
    else if (cleanName.toLowerCase().includes('văn')) guessedSubject = 'Ngữ văn';
    else if (cleanName.toLowerCase().includes('anh')) guessedSubject = 'Tiếng Anh';
    else if (cleanName.toLowerCase().includes('lí') || cleanName.toLowerCase().includes('vật lý')) guessedSubject = 'Vật lý';
    else if (cleanName.toLowerCase().includes('hóa')) guessedSubject = 'Hóa học';
    else if (cleanName.toLowerCase().includes('sinh')) guessedSubject = 'Sinh học';
    else if (cleanName.toLowerCase().includes('sử')) guessedSubject = 'Lịch sử';
    else if (cleanName.toLowerCase().includes('địa')) guessedSubject = 'Địa lý';
    else if (cleanName.toLowerCase().includes('tin')) guessedSubject = 'Tin học';
    else if (cleanName.toLowerCase().includes('công dân') || cleanName.toLowerCase().includes('gdcd')) guessedSubject = 'GDCD';

    // Guess grade (THPT: Lớp 10, 11, 12)
    let guessedGrade = 'Lớp 12';
    const gradeMatch = cleanName.match(/(?:lớp|khối|grade)?\s*(10|11|12)\b/i);
    if (gradeMatch && gradeMatch[1]) {
      guessedGrade = `Lớp ${gradeMatch[1]}`;
    }

    // Guess curriculum
    let guessedCurriculum: string = CURRICULUM_OPTIONS[0];
    if (cleanName.toLowerCase().includes('cánh diều')) {
      guessedCurriculum = 'Cánh Diều';
    } else if (cleanName.toLowerCase().includes('chân trời')) {
      guessedCurriculum = 'Chân trời sáng tạo';
    } else if (cleanName.toLowerCase().includes('kết nối')) {
      guessedCurriculum = 'Kết nối tri thức với cuộc sống';
    }

    const formattedSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

    return {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      fileName: file.name,
      fileSizeBytes: file.size,
      fileSizeFormatted: formattedSize,
      title: cleanName,
      subject: guessedSubject,
      gradeLevel: guessedGrade,
      curriculumName: guessedCurriculum,
      status: 'READY_FOR_SCAN',
    };
  };

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validNewBooks: PendingUploadBook[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Format check
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        errors.push(`File "${file.name}" không phải định dạng PDF hợp lệ.`);
        continue;
      }

      // Size check (100MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(
          `File "${file.name}" dung lượng (${(file.size / (1024 * 1024)).toFixed(1)} MB) vượt quá giới hạn cho phép (tối đa 100 MB).`
        );
        continue;
      }

      validNewBooks.push(parseFileInfo(file));
    }

    if (errors.length > 0) {
      onError(errors.join('\n'));
    }

    if (validNewBooks.length > 0) {
      onFilesAdded(validNewBooks);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  return (
    <div
      className={`${styles.dropzoneArea} ${
        isDragActive ? styles.dropzoneActive : styles.dropzoneIdle
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className={styles.dropzoneIconWrap}>
        <span className={styles.dropzoneIcon}>cloud_upload</span>
      </div>

      <h3 className={styles.dropzoneTitle}>
        Kéo thả 1 hoặc nhiều file Sách Giáo Khoa (PDF) vào đây
      </h3>
      <p className={styles.dropzoneDesc}>
        Hệ thống tự động đọc tên sách, trích xuất cấu trúc và chuẩn bị sẵn sàng để quét mục lục AI theo chương trình chuẩn Bộ GD&ĐT.
      </p>

      <div className={styles.dropzoneButtonRow}>
        <button
          type="button"
          className={styles.dropzoneUploadBtn}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Chọn File PDF từ máy</span>
        </button>
      </div>

      <div className={styles.dropzoneFormatsBadge}>
        <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
        <span>Hỗ trợ chọn nhiều file PDF cùng lúc • Dung lượng tối đa: 100 MB / file sách</span>
      </div>
    </div>
  );
}
