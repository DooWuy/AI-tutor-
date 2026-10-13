import React, { useState, useMemo, useEffect } from 'react';
import {
  CURATED_PALETTE_COLORS,
  THEME_PRESETS,
  getSubjectColor,
  getSubjectIcon,
  generateSubjectStyles,
  autoHarmonizePalette
} from '../../../../utils/subjectColorUtils';

interface SubjectColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: string[];
  currentColors: Record<string, string>;
  onSaveColors: (newColors: Record<string, string>) => Promise<void>;
  isDarkMode?: boolean;
}

export const SubjectColorModal: React.FC<SubjectColorModalProps> = ({
  isOpen,
  onClose,
  subjects,
  currentColors,
  onSaveColors,
  isDarkMode = true
}) => {
  // Local state for draft colors
  const [draftColors, setDraftColors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('smart');
  const [isSaving, setIsSaving] = useState(false);

  // Strictly subjects currently present in the timetable
  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    (subjects || []).forEach(s => {
      const trimmed = s?.trim();
      if (trimmed) set.add(trimmed);
    });
    return Array.from(set);
  }, [subjects]);

  // Initialize draft colors when modal opens or timetable subjects change
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {};
      allSubjects.forEach(s => {
        initial[s] = getSubjectColor(s, currentColors);
      });
      setDraftColors(initial);
      setSelectedTheme('custom');
      setSearchTerm('');
    }
  }, [isOpen, allSubjects, currentColors]);

  // Filtered subjects based on search term
  const filteredSubjects = useMemo(() => {
    if (!searchTerm.trim()) return allSubjects;
    const term = searchTerm.toLowerCase().trim();
    return allSubjects.filter(s => s.toLowerCase().includes(term));
  }, [allSubjects, searchTerm]);

  if (!isOpen) return null;

  // Handle color change for a subject
  const handleColorChange = (subject: string, colorHex: string) => {
    setDraftColors(prev => ({
      ...prev,
      [subject]: colorHex
    }));
  };

  // Apply a theme preset
  const handleApplyTheme = (themeId: string) => {
    setSelectedTheme(themeId);
    const newPalette = autoHarmonizePalette(allSubjects, themeId);
    setDraftColors(newPalette);
  };

  // Smart AI Harmonize
  const handleSmartHarmonize = () => {
    const harmonized = autoHarmonizePalette(allSubjects, 'smart');
    setDraftColors(harmonized);
    setSelectedTheme('smart');
  };

  // Reset all to system defaults
  const handleResetDefaults = () => {
    const resetObj: Record<string, string> = {};
    allSubjects.forEach(s => {
      resetObj[s] = getSubjectColor(s, null);
    });
    setDraftColors(resetObj);
    setSelectedTheme('default');
  };

  // Save handler - only persist colors for active subjects in the timetable
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const cleanedColors: Record<string, string> = {};
      allSubjects.forEach(s => {
        cleanedColors[s] = draftColors[s] || getSubjectColor(s, currentColors);
      });
      await onSaveColors(cleanedColors);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-surface rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-outline-variant overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-outline-variant bg-gradient-to-r from-primary/10 via-surface to-secondary/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-on-primary shadow-md">
              <span className="material-symbols-outlined text-2xl">palette</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-on-surface">
                  Tùy chỉnh Bảng mã màu Môn học
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  Cá nhân hóa
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Tự do chọn màu theo sở thích hoặc chọn bộ chủ đề thông minh giúp thời khóa biểu sinh động, dễ nhìn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* THEME PRESETS SECTION */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">style</span>
                Bộ chủ đề phong cách (Áp dụng 1 chạm)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSmartHarmonize}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 transition active:scale-95"
                  title="Tự động phân phối màu sắc tối ưu không trùng lặp"
                >
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  Gợi ý AI thông minh
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition active:scale-95"
                  title="Khôi phục màu mặc định ban đầu"
                >
                  <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                  Mặc định
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {THEME_PRESETS.map(preset => {
                const isSelected = selectedTheme === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyTheme(preset.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 relative group ${
                      isSelected
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/30 shadow-xs'
                        : 'bg-surface-container-low/50 border-outline-variant hover:border-primary/50 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface truncate flex items-center gap-1">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[15px] text-primary">check_circle</span>
                      )}
                    </div>
                    {/* Palette Dots */}
                    <div className="flex items-center gap-1 overflow-hidden">
                      {preset.palette.slice(0, 6).map((c, i) => (
                        <span
                          key={i}
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-white/20"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SEARCH & STATUS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 border-t border-outline-variant/60">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 text-base">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm môn học trong thời khóa biểu..."
                className="w-full pl-9 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant text-[11px] text-on-surface-variant shrink-0">
              <span className="material-symbols-outlined text-sm text-primary">sync</span>
              <span>Đồng bộ từ TKB: <strong>{allSubjects.length}</strong> môn</span>
            </div>
          </div>

          {/* SUBJECT COLOR CUSTOMIZATION LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
              <span>Danh sách môn học trong TKB ({filteredSubjects.length} môn)</span>
              <span className="text-[11px] text-on-surface-variant/70">
                💡 Tự động cập nhật theo các môn thực tế xuất hiện trong thời khóa biểu
              </span>
            </div>

            {allSubjects.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant text-on-surface-variant space-y-2">
                <span className="material-symbols-outlined text-3xl text-outline/50">calendar_today</span>
                <p className="text-xs font-semibold text-on-surface">Chưa có môn học nào trong thời khóa biểu</p>
                <p className="text-[11px] text-on-surface-variant/70">
                  Hãy thêm tiết học vào bảng hoặc sử dụng tính năng "Quét & Nhập TKB bằng AI" để các môn học tự động xuất hiện tại đây.
                </p>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant text-on-surface-variant text-xs">
                Không tìm thấy môn học nào khớp với từ khóa "{searchTerm}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSubjects.map(subject => {
                  const currentColor = getSubjectColor(subject, draftColors);
                  const styles = generateSubjectStyles(currentColor, isDarkMode);
                  const icon = getSubjectIcon(subject);

                  return (
                    <div
                      key={subject}
                      className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant hover:border-outline hover:shadow-xs transition space-y-2.5 flex flex-col justify-between"
                    >
                      {/* Top: Name & Live Mini Card Preview */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div 
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                            style={{ 
                              backgroundColor: styles.badgeStyle.backgroundColor,
                              color: styles.iconColor,
                              border: `1px solid ${styles.badgeStyle.borderColor}` 
                            }}
                          >
                            <span className="material-symbols-outlined text-base">{icon}</span>
                          </div>
                          <span className="font-bold text-xs text-on-surface truncate" title={subject}>
                            {subject}
                          </span>
                        </div>

                        {/* Live Mini Preview Badge */}
                        <div 
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 shadow-2xs select-none"
                          style={styles.badgeStyle}
                        >
                          {subject}
                        </div>
                      </div>

                      {/* Middle: Color Swatches + Custom Picker */}
                      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-outline-variant/40">
                        {/* Quick Palette Circles */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {CURATED_PALETTE_COLORS.slice(0, 7).map(col => {
                            const isChosen = currentColor.toLowerCase() === col.hex.toLowerCase();
                            return (
                              <button
                                key={col.hex}
                                type="button"
                                onClick={() => handleColorChange(subject, col.hex)}
                                className={`w-5 h-5 rounded-full transition-all shrink-0 relative flex items-center justify-center shadow-2xs ${
                                  isChosen 
                                    ? 'scale-120 ring-2 ring-primary ring-offset-1 ring-offset-surface' 
                                    : 'hover:scale-115 opacity-80 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: col.hex }}
                                title={`${col.name} (${col.hex})`}
                              >
                                {isChosen && (
                                  <span className="material-symbols-outlined text-[11px] text-white font-bold drop-shadow">
                                    check
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom Color Input / Picker Button */}
                        <div className="flex items-center gap-1 shrink-0">
                          <label 
                            className="relative flex items-center gap-1 px-2 py-1 rounded-lg border border-outline-variant hover:border-primary bg-surface-container-low cursor-pointer transition text-[11px] font-semibold text-on-surface shadow-2xs group"
                            title="Chọn mã màu bất kỳ theo sở thích"
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20 shadow-2xs"
                              style={{ backgroundColor: currentColor }}
                            />
                            <span className="font-mono text-[10px] uppercase text-on-surface-variant group-hover:text-primary">
                              {currentColor}
                            </span>
                            <span className="material-symbols-outlined text-[13px] text-on-surface-variant group-hover:text-primary">
                              colorize
                            </span>
                            <input
                              type="color"
                              value={currentColor}
                              onChange={e => handleColorChange(subject, e.target.value)}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                          </label>

                          {/* Reset button for single subject */}
                          <button
                            type="button"
                            onClick={() => {
                              const orig = getSubjectColor(subject, null);
                              handleColorChange(subject, orig);
                            }}
                            className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container transition"
                            title="Khôi phục màu tự động cho môn này"
                          >
                            <span className="material-symbols-outlined text-[13px]">undo</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* REAL-TIME TIMETABLE PREVIEW STRIP */}
          <div className="p-3.5 bg-surface-container-low/70 rounded-xl border border-outline-variant space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">visibility</span>
                Mô phỏng hiển thị trên Thời khóa biểu
              </span>
              <span className="text-[10px] text-on-surface-variant">Thời gian thực</span>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {allSubjects.slice(0, 8).map(subject => {
                const color = getSubjectColor(subject, draftColors);
                const styles = generateSubjectStyles(color, isDarkMode);
                const icon = getSubjectIcon(subject);

                return (
                  <div
                    key={subject}
                    className="p-2 rounded-xl border min-w-[110px] max-w-[130px] shrink-0 select-none shadow-xs transition"
                    style={styles.cardStyle}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span 
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold truncate max-w-full inline-block"
                        style={styles.badgeStyle}
                      >
                        {subject}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/80 font-medium">
                      <span className="material-symbols-outlined text-[12px]">{icon}</span>
                      <span>Tiết học</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-low flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span>
            <span>Đã cá nhân hóa <strong>{Object.keys(draftColors).length}</strong> màu sắc</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container-high transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 shadow-md transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Lưu & Áp dụng
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
