import React, { useState, useEffect, useRef } from 'react';
import { styles } from './TimetablePage.styles';
import type { ScheduleSlotDto } from '../../../types/schedule';
import { extractScheduleFromImage, createSchedule, getActiveSchedule } from '../../../services/scheduleApi';

export const TimetablePage: React.FC = () => {
  const [showSettings, setShowSettings] = useState(true);
  const [slots, setSlots] = useState<ScheduleSlotDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadActiveSchedule();
  }, []);

  const loadActiveSchedule = async () => {
    try {
      setIsLoading(true);
      const res = await getActiveSchedule();
      setSlots(res.slots || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsLoading(true);
      const extracted = await extractScheduleFromImage(file);
      setSlots(extracted?.data || []);
      alert('Đã quét TKB bằng AI thành công! Nhấn "Lưu TKB" để lưu lại.');
    } catch (err: any) {
      alert(err.message || 'Lỗi quét ảnh');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setIsLoading(true);
      await createSchedule({ name: 'Thời khóa biểu AI', slots });
      alert('Đã lưu TKB thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu');
    } finally {
      setIsLoading(false);
    }
  };

  const getSubjectCard = (day: number, index: number) => {
    const daySlots = slots.filter(s => s.dayOfWeek === day).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    const slot = daySlots[index];
    if (!slot) return <td key={`${day}-${index}`} className={styles.emptyCell}><span className="text-[11px] italic">Trống</span></td>;
    
    let cardClass = styles.cardSurface;
    let badgeClass = styles.badgeSurface;
    
    const name = (slot.subjectName || '').toLowerCase();
    if (name.includes('toán')) { cardClass = styles.cardPrimary; badgeClass = styles.badgePrimary; }
    else if (name.includes('văn')) { cardClass = styles.cardPurple; badgeClass = styles.badgePurple; }
    else if (name.includes('anh')) { cardClass = styles.cardEmerald; badgeClass = styles.badgeEmerald; }
    else if (name.includes('lý')) { cardClass = 'rounded-xl p-2.5 bg-teal-50 border border-teal-200 text-on-surface hover:shadow-sm transition'; badgeClass = 'inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800'; }
    else if (name.includes('hóa')) { cardClass = 'rounded-xl p-2.5 bg-orange-50 border-2 border-tertiary text-on-surface hover:shadow-md transition'; badgeClass = 'inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-tertiary text-on-tertiary'; }
    else if (name.includes('sử') || name.includes('địa')) { cardClass = styles.cardAmber; badgeClass = styles.badgeAmber; }

    return (
      <td className={styles.cellBase} key={`${day}-${index}`}>
        <div className={cardClass}>
          <span className={badgeClass}>{slot.subjectName}</span>
          <p className={styles.subjectTitle}>{slot.subjectName}</p>
          <p className={styles.subjectDesc}>
            {slot.room ? `${slot.room} • ` : ''}
            {slot.teacherName || (slot.startTime ? slot.startTime.substring(0, 5) : '')}
          </p>
        </div>
      </td>
    );
  };

  return (
    <div className={styles.container}>
      {/* BREADCRUMB & HEADER SECTION */}
      <div className={styles.breadcrumbWrapper}>
        <nav className={styles.breadcrumb}>
          <a className={styles.breadcrumbLink} href="#">Trang chủ</a>
          <span className={styles.breadcrumbIcon}>chevron_right</span>
          <span className={styles.breadcrumbActive}>Thời khóa biểu cá nhân</span>
        </nav>
        
        <div className={styles.headerSection}>
          <div>
            <h1 className={styles.title}>Thời khóa biểu Cá nhân</h1>
            <p className={styles.subtitle}>Theo dõi lịch học, chuẩn bị sách vở bài tập và tối ưu hóa thời gian cùng Trợ lý AI.</p>
          </div>
          
          {/* ACTION TOOLBAR */}
          <div className={styles.toolbar}>
            <input type="file" ref={fileInputRef} onChange={handleUploadImage} style={{ display: 'none' }} accept="image/*" />
            <button className={styles.aiBtn} onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isLoading ? 'hourglass_empty' : 'smart_toy'}
              </span>
              <span className="">{isLoading ? 'Đang quét...' : 'Quét & Nhập TKB bằng AI'}</span>
            </button>
            <button className={styles.configBtn} onClick={handleSaveSchedule} disabled={isLoading}>
              <span className="material-symbols-outlined text-base text-primary">save</span>
              <span className="">Lưu TKB</span>
            </button>
            <button className={styles.configBtn} onClick={() => setShowSettings(!showSettings)}>
              <span className="material-symbols-outlined text-base text-primary">tune</span>
              <span className="">Cài đặt</span>
            </button>
            <button className={styles.addBtn}>
              <span className="material-symbols-outlined text-base">add</span>
              <span className="">Thêm tiết học</span>
            </button>
            
            <div className={styles.weekSwitcher}>
              <button className={styles.weekBtn}>
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <div className={styles.weekText}>Tuần này: 18/11 - 24/11/2024</div>
              <button className={styles.weekBtn}>
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
            
            <button className={styles.exportBtn}>
              <span className="material-symbols-outlined text-base">print</span>
              <span className="hidden sm:inline">In / Đồng bộ</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI SCHEDULE ASSISTANT HIGHLIGHT BANNER */}
      <div className={styles.banner}>
        <div className={styles.bannerContent}>
          <div className="flex items-start gap-3.5">
            <div className={styles.bannerIconWrapper}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_fix_high</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={styles.bannerStatus}>
                  <span className={styles.bannerStatusDot}></span>
                  Trợ lý AI Đang Hoạt Động
                </span>
                <span className={styles.bannerSubtitle}>Đã tối ưu 100% tuần này</span>
              </div>
              <p className={styles.bannerText}>
                Phát hiện ngày mai <strong className="text-primary font-bold">(Thứ Ba)</strong> có <span className="text-tertiary font-semibold underline decoration-tertiary decoration-2">1 bài kiểm tra 15 phút môn Hóa Học</span> và <span className="text-error font-semibold">2 bài tập Toán</span> chưa hoàn thành.
              </p>
            </div>
          </div>
          
          <div className={styles.bannerActionGroup}>
            <button className={styles.bannerPrimaryBtn}>
              <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
              <span className="">Nhờ AI chuẩn bị bài ngày mai</span>
            </button>
            <button className={styles.bannerSecondaryBtn}>Phân bổ giờ tự học</button>
          </div>
        </div>
      </div>

      {/* MAIN TIMETABLE LAYOUT (GRID & SIDEBAR) */}
      <div className={styles.gridContainer}>
        {/* ================== LEFT TIMETABLE GRID ================== */}
        <div className={styles.tableWrapper}>
          {/* Grid Header */}
          <div className={styles.tableHeader}>
            <div className={styles.tableHeaderTitleGroup}>
              <span className="material-symbols-outlined text-primary">calendar_view_week</span>
              <h2 className={styles.tableHeaderTitle}>Lưới thời khóa biểu học kỳ 1 (Năm học 2024 - 2025)</h2>
            </div>
            <div className={styles.tableHeaderActions}>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed/80 border border-primary/30 rounded-xl text-xs font-semibold shadow-xs transition active:scale-95">
                <span className="material-symbols-outlined text-sm">tune</span>
                <span className="">Cấu hình khung giờ & số tiết</span>
              </button>
              <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant p-1 rounded-xl">
                <button className="px-3 py-1 bg-primary text-on-primary text-xs font-semibold rounded-lg shadow-sm">Xem cả tuần</button>
                <button className="px-3 py-1 text-on-surface-variant hover:text-primary text-xs font-medium rounded-lg">Chỉ hôm nay</button>
              </div>
            </div>
          </div>

          {/* Expanded Settings Panel (Tùy chỉnh số tiết & khung giờ) */}
          {showSettings && (
            <div className={styles.settingsPanel}>
              <div className={styles.settingsHeader}>
                <div className={styles.settingsTitleGroup}>
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  <span>TÙY CHỈNH SỐ TIẾT & KHUNG GIỜ RA CHƠI THEO TRƯỜNG HỌC</span>
                </div>
                <button className={styles.settingsCloseBtn} onClick={() => setShowSettings(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className={styles.settingsGrid}>
                {/* Morning Session Settings */}
                <div className={styles.settingsCard}>
                  <div className={styles.settingsCardHeader}>
                    <div className={styles.settingsCardHeaderLeft}>
                      <span className="material-symbols-outlined text-primary text-[18px]">wb_sunny</span>
                      <span>Ca học Buổi Sáng</span>
                    </div>
                    <span className="bg-primary-fixed text-primary px-2 py-0.5 rounded-full text-[11px]">5 tiết học</span>
                  </div>
                  
                  <div className={styles.settingsFieldGroup}>
                    <div className={styles.settingsField}>
                      <label className={styles.settingsLabel}>Số tiết sáng:</label>
                      <select className={styles.settingsInput}>
                        <option>5 tiết (Tiêu chuẩn)</option>
                      </select>
                    </div>
                    <div className={styles.settingsField}>
                      <label className={styles.settingsLabel}>Bắt đầu từ:</label>
                      <input type="time" className={styles.settingsInput} defaultValue="07:15" />
                    </div>
                  </div>
                  
                  <div className={styles.settingsBreak}>
                    <div className={styles.settingsBreakHeader}>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">coffee</span>
                        <span>Giờ ra chơi sáng:</span>
                      </div>
                      <span className="text-[11px] font-normal text-on-surface-variant">Sau Tiết 2</span>
                    </div>
                    <div className={styles.settingsFieldGroup}>
                      <div className={styles.settingsField}>
                        <label className={styles.settingsLabel}>Khung giờ ra chơi</label>
                        <input type="text" className={styles.settingsInput} defaultValue="08:50 - 09:15 (25p)" />
                      </div>
                      <div className={styles.settingsField}>
                        <label className={styles.settingsLabel}>Hoạt động giữa giờ</label>
                        <input type="text" className={styles.settingsInput} defaultValue="Thể dục & Ăn nhẹ" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Afternoon Session Settings */}
                <div className={styles.settingsCard}>
                  <div className={styles.settingsCardHeader}>
                    <div className={styles.settingsCardHeaderLeft}>
                      <span className="material-symbols-outlined text-orange-500 text-[18px]">light_mode</span>
                      <span>Ca học Buổi Chiều</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-on-surface-variant">
                      Bật ca chiều 
                      <div className="w-8 h-4 bg-primary rounded-full relative flex items-center px-[2px] cursor-pointer">
                        <div className="w-3 h-3 bg-white rounded-full shadow-sm transform translate-x-4"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.settingsFieldGroup}>
                    <div className={styles.settingsField}>
                      <label className={styles.settingsLabel}>Số tiết chiều:</label>
                      <select className={styles.settingsInput}>
                        <option>3 tiết (Học thêm/Tăng cường)</option>
                      </select>
                    </div>
                    <div className={styles.settingsField}>
                      <label className={styles.settingsLabel}>Giờ vào ca chiều:</label>
                      <input type="time" className={styles.settingsInput} defaultValue="13:30" />
                    </div>
                  </div>
                  
                  <div className={styles.settingsBreak}>
                    <div className={styles.settingsBreakHeader}>
                      <div className="flex items-center gap-1 text-orange-600">
                        <span className="material-symbols-outlined text-[16px]">flag</span>
                        <span>Giờ ra chơi chiều:</span>
                      </div>
                      <span className="text-[11px] font-normal text-on-surface-variant">Sau Tiết 2 chiều</span>
                    </div>
                    <div className={styles.settingsFieldGroup}>
                      <div className={styles.settingsField}>
                        <label className={styles.settingsLabel}>Khung giờ ra chơi</label>
                        <input type="text" className={styles.settingsInput} defaultValue="15:05 - 15:25 (20p)" />
                      </div>
                      <div className={styles.settingsField}>
                        <label className={styles.settingsLabel}>Thời lượng mỗi tiết</label>
                        <input type="text" className={styles.settingsInput} defaultValue="45 phút / tiết" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.settingsFooter}>
                <div className={styles.settingsFooterText}>
                  <span className="material-symbols-outlined text-[14px] text-primary">info</span>
                  Thời khóa biểu sẽ tự động căn lề khung thời gian theo cài đặt của bạn.
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-outline cursor-pointer hover:text-on-surface transition">Đặt lại mặc định</span>
                  <button className={styles.settingsSaveBtn}>Lưu & Cập nhật TKB</button>
                </div>
              </div>
            </div>
          )}
          
          {/* Table Content */}
          <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
            <table className={styles.table}>
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                  <th className={styles.thTime}>Tiết / Khung giờ</th>
                  <th className={styles.thBase}>Thứ Hai <span className={styles.thNormalDate}>18/11</span></th>
                  <th className={styles.thToday}>
                    <div className={styles.thTodayBadge}>Hôm nay</div>
                    <div className="mt-2">Thứ Ba</div>
                    <span className={styles.thTodayDate}>19/11</span>
                  </th>
                  <th className={styles.thBase}>Thứ Tư <span className={styles.thNormalDate}>20/11</span></th>
                  <th className={styles.thBase}>Thứ Năm <span className={styles.thNormalDate}>21/11</span></th>
                  <th className={styles.thBase}>Thứ Sáu <span className={styles.thNormalDate}>22/11</span></th>
                  <th className={styles.thBase}>Thứ Bảy <span className={styles.thNormalDate}>23/11</span></th>
                  <th className={styles.thBase}>Chủ Nhật <span className={styles.thNormalDate}>24/11</span></th>
                </tr>
              </thead>
                            <tbody className={styles.tbody}>
                {/* Session Sáng */}
                <tr className={styles.sessionHeaderRow}>
                  <td colSpan={8} className="py-2 px-4">
                    <div className={styles.sessionHeaderCell}>
                      <div className={styles.sessionHeaderLeft}>
                        <span className="material-symbols-outlined text-sm">wb_sunny</span>
                        <span>BUỔI SÁNG (07:15 - 11:40) • 5 TIẾT CHÍNH KHÓA</span>
                      </div>
                    </div>
                  </td>
                </tr>

                {[0, 1].map(index => (
                  <tr className={styles.timeRow} key={`morning-${index}`}>
                    <td className={styles.timeCell}>
                      <div className={styles.timeCellTitle}>Tiết {index + 1}</div>
                    </td>
                    {[2, 3, 4, 5, 6, 7, 8].map(day => getSubjectCard(day, index))}
                  </tr>
                ))}

                {/* Giờ ra chơi */}
                <tr className={styles.breakRow}>
                  <td colSpan={8} className={styles.breakRowContent}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">coffee</span>
                      <span className="font-bold text-primary">Giờ ra chơi Buổi Sáng (08:50 - 09:15)</span>
                    </div>
                  </td>
                </tr>

                {[2, 3, 4].map(index => (
                  <tr className={styles.timeRow} key={`morning-${index}`}>
                    <td className={styles.timeCell}>
                      <div className={styles.timeCellTitle}>Tiết {index + 1}</div>
                    </td>
                    {[2, 3, 4, 5, 6, 7, 8].map(day => getSubjectCard(day, index))}
                  </tr>
                ))}

                {/* Nghỉ Trưa */}
                <tr className={styles.lunchRow}>
                  <td colSpan={8} className={styles.lunchRowContent}>
                    <span className="material-symbols-outlined text-[16px]">restaurant</span>
                    <span>NGHỈ TRƯA & ĂN BÁN TRÚ (11:40 - 13:30)</span>
                  </td>
                </tr>

                {/* Session Chiều */}
                <tr className={styles.sessionHeaderRow}>
                  <td colSpan={8} className="py-2 px-4">
                    <div className={styles.sessionHeaderCell}>
                      <div className={styles.sessionHeaderLeft}>
                        <span className="material-symbols-outlined text-sm text-orange-500">light_mode</span>
                        <span className="text-orange-600">BUỔI CHIỀU (13:30 - 16:30) • TIẾT HỌC THÊM</span>
                      </div>
                    </div>
                  </td>
                </tr>

                {[5, 6].map(index => (
                  <tr className={styles.timeRow} key={`afternoon-${index}`}>
                    <td className={styles.timeCell}>
                      <div className={styles.timeCellTitle}>Tiết {index - 4} Chiều</div>
                    </td>
                    {[2, 3, 4, 5, 6, 7, 8].map(day => getSubjectCard(day, index))}
                  </tr>
                ))}

                {/* Giờ ra chơi chiều */}
                <tr className="bg-orange-50/50 border-y-2 border-orange-200">
                  <td colSpan={8} className={styles.breakRowContent}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-500 text-base">emoji_food_beverage</span>
                      <span className="font-bold text-orange-700">Giờ ra chơi Buổi Chiều (15:05 - 15:25)</span>
                    </div>
                  </td>
                </tr>

                {[7].map(index => (
                  <tr className={styles.timeRow} key={`afternoon-${index}`}>
                    <td className={styles.timeCell}>
                      <div className={styles.timeCellTitle}>Tiết {index - 4} Chiều</div>
                    </td>
                    {[2, 3, 4, 5, 6, 7, 8].map(day => getSubjectCard(day, index))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Table Legend */}
          <div className="p-3 bg-surface-container-low border-t border-outline-variant flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-on-surface">Chú thích môn học:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Toán học</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> Hóa học</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Tiếng Anh</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div> Ngữ văn</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div> Vật lý</span>
              </div>
            </div>
            <button className="text-primary font-semibold flex items-center gap-1 hover:underline">
              <span className="material-symbols-outlined text-[14px]">tune</span> Tùy chỉnh mã màu môn học
            </button>
          </div>
        </div>

        {/* ================== RIGHT SIDEBAR ================== */}
        <div className={styles.sidebarWrapper}>
          
          {/* Card 1: Checklist Ngày Mai */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <div className="flex items-center gap-2">
                <h3 className={styles.sidebarCardTitle}>Cần chuẩn bị cho ngày mai (Thứ Ba)</h3>
              </div>
              <span className={styles.sidebarBadge}>4 môn học</span>
            </div>
            <p className={styles.sidebarDesc}>Checklist sách giáo khoa, vở ghi và đồ dùng được AI tự động lập theo TKB:</p>
            
            <div className="space-y-2 mt-3">
              {/* Item 1 - Checked */}
              <div className={styles.checklistItemChecked}>
                <div className={styles.checkboxChecked}>
                  <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                </div>
                <div>
                  <p className={styles.checklistTitleChecked}>SGK Hình học 10 & Máy tính Casio 580</p>
                  <p className={styles.checklistSub}>Tiết 1: Toán học (P.302)</p>
                </div>
              </div>
              
              {/* Item 2 */}
              <div className={styles.checklistItem}>
                <div className={styles.checkbox}></div>
                <div>
                  <p className={styles.checklistTitle}>SGK Hóa 10 & Bảng tuần hoàn</p>
                  <p className={styles.checklistSub}>Tiết 2: Có kiểm tra 15p liên kết hóa học</p>
                </div>
              </div>
              
              {/* Item 3 */}
              <div className={styles.checklistItem}>
                <div className={styles.checkbox}></div>
                <div>
                  <p className={styles.checklistTitle}>Vở bài tập Sinh học 10</p>
                  <p className={styles.checklistSub}>Tiết 3: Nộp sơ đồ tế bào nhân thực</p>
                </div>
              </div>
              
              {/* Item 4 */}
              <div className={styles.checklistItem}>
                <div className={styles.checkbox}></div>
                <div>
                  <p className={styles.checklistTitle}>SGK Giáo dục Kinh tế & Pháp luật 10</p>
                  <p className={styles.checklistSub}>Tiết 4: P.302</p>
                </div>
              </div>
            </div>
            
            <button className={styles.addReminderBtn}>
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              Thêm mục nhắc nhở mới
            </button>
          </div>
          
          {/* Card 2: Nhắc nhở học tập Toggle */}
          <div className={styles.sidebarCard}>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
              <h3 className={styles.sidebarCardTitle}>Nhắc nhở học tập</h3>
            </div>
            
            <div className={styles.reminderToggleWrapper}>
              <div className={styles.reminderToggleLeft}>
                <p className={styles.reminderToggleTitle}>Nhắc bài trước 15 phút</p>
                <p className={styles.reminderToggleSub}>Gửi qua App AI Tutor & Zalo</p>
              </div>
              <div className={styles.toggleBg}>
                <div className={styles.toggleKnob}></div>
              </div>
            </div>
            
            <div className={styles.reminderNextBox}>
              <div className={styles.reminderNextTitle}>
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                Lần nhắc tiếp theo: 07:00 ngày mai
              </div>
              <p className={styles.reminderNextDesc}>
                "Chuẩn bị vào Tiết 1 Toán học - Thầy Tuấn tại P.302"
              </p>
            </div>
          </div>
          
          {/* Card 3: Upload TKB */}
          <div className={styles.uploadCard}>
            <div className={styles.uploadIconWrapper}>
              <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
            </div>
            <div className="space-y-1">
              <h3 className={styles.uploadTitle}>Có ảnh chụp TKB mới?</h3>
              <p className={styles.uploadDesc}>Tải ảnh chụp giấy hoặc ảnh chụp màn hình Zalo, AI tự tạo bảng tuần chỉ sau 3 giây.</p>
            </div>
            <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Tải ảnh lên ngay'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
