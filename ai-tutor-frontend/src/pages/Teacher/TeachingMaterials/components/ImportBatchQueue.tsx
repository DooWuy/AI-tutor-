import { styles } from '../TeachingMaterialsPage.styles';
import {
  SUBJECT_OPTIONS,
  GRADE_OPTIONS,
  CURRICULUM_OPTIONS,
  type PendingUploadBook,
} from '../types/curriculum';

interface ImportBatchQueueProps {
  pendingBooks: PendingUploadBook[];
  onUpdateBook: (id: string, updates: Partial<PendingUploadBook>) => void;
  onRemoveBook: (id: string) => void;
  onClearQueue: () => void;
  onSaveBatch: () => Promise<void>;
  onOpenScanForBook: (book: PendingUploadBook) => void;
  isSaving: boolean;
}

export function ImportBatchQueue({
  pendingBooks,
  onUpdateBook,
  onRemoveBook,
  onClearQueue,
  onSaveBatch,
  onOpenScanForBook,
  isSaving,
}: ImportBatchQueueProps) {
  if (pendingBooks.length === 0) return null;

  return (
    <div className={styles.queueCard}>
      {/* Header Bar */}
      <div className={styles.queueHeaderRow}>
        <div className={styles.queueHeaderTitle}>
          <span className="material-symbols-outlined text-primary text-[20px]">
            checklist_rtl
          </span>
          <span>Danh sách Sách chờ nạp & quét mục lục</span>
          <span className={styles.queueCountBadge}>{pendingBooks.length} cuốn</span>
        </div>

        <div className={styles.queueHeaderActions}>
          <button
            type="button"
            className={styles.queueClearBtn}
            onClick={onClearQueue}
            disabled={isSaving}
          >
            <span className="material-symbols-outlined text-[16px]">clear_all</span>
            <span>Xóa danh sách</span>
          </button>

          <button
            type="button"
            className={styles.queueSaveBtn}
            onClick={onSaveBatch}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">
                  progress_activity
                </span>
                <span>Đang lưu vào hệ thống...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Lưu toàn bộ vào CSDL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Queue Items */}
      <div className="space-y-3">
        {pendingBooks.map((item) => (
          <div key={item.id} className={styles.queueItemCard}>
            {/* Top row: File info + Status + Delete */}
            <div className={styles.queueItemTop}>
              <div className={styles.queueFileMeta}>
                <div className={styles.queueFileIcon}>
                  <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                </div>
                <div className="min-w-0">
                  <div className={styles.queueFileName} title={item.fileName}>
                    {item.fileName}
                  </div>
                  <div className={styles.queueFileSize}>{item.fileSizeFormatted}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.status === 'READY_FOR_SCAN' && (
                  <span className={styles.queueStatusBadgeReady}>
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                    <span>Sẵn sàng scan book</span>
                  </span>
                )}
                {item.status === 'SAVING' && (
                  <span className={styles.queueStatusBadgeSaving}>
                    <span className="material-symbols-outlined text-[14px] animate-spin">
                      sync
                    </span>
                    <span>Đang lưu...</span>
                  </span>
                )}
                {item.status === 'SAVED' && (
                  <span className={styles.queueStatusBadgeSaved}>
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    <span>Đã lưu vào CSDL</span>
                  </span>
                )}
                {item.status === 'ERROR' && (
                  <span className={styles.queueStatusBadgeError}>
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    <span>{item.errorMessage || 'Lỗi khi lưu'}</span>
                  </span>
                )}

                <button
                  type="button"
                  className={styles.queueRemoveBtn}
                  onClick={() => onRemoveBook(item.id)}
                  title="Xóa khỏi hàng đợi"
                  disabled={isSaving}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Editable Fields: Title, Subject, Grade, Curriculum */}
            <div className={styles.queueFieldsGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Tên Sách Giáo Khoa *</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => onUpdateBook(item.id, { title: e.target.value })}
                  placeholder="Ví dụ: Toán 12 - Tập 1"
                  className={styles.inputControl}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Môn học *</label>
                <select
                  value={item.subject}
                  onChange={(e) => onUpdateBook(item.id, { subject: e.target.value })}
                  className={styles.selectControl}
                >
                  {SUBJECT_OPTIONS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Khối lớp *</label>
                <select
                  value={item.gradeLevel}
                  onChange={(e) => onUpdateBook(item.id, { gradeLevel: e.target.value })}
                  className={styles.selectControl}
                >
                  {GRADE_OPTIONS.map((gr) => (
                    <option key={gr} value={gr}>
                      {gr}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Bộ sách / Chương trình *</label>
                <select
                  value={item.curriculumName}
                  onChange={(e) => onUpdateBook(item.id, { curriculumName: e.target.value })}
                  className={styles.selectControl}
                >
                  {CURRICULUM_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className={styles.queueActionRow}>
              <button
                type="button"
                className={styles.scanActionBtn}
                onClick={() => onOpenScanForBook(item)}
              >
                <span className="material-symbols-outlined text-[16px]">document_scanner</span>
                <span>Quét Mục Lục AI (Scan TOC)</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
