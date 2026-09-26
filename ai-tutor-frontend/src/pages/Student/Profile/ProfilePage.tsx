import React, { useState } from 'react';
import { styles } from './ProfilePage.styles';

export const ProfilePage: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [goalMinutes, setGoalMinutes] = useState(45);
  const [name, setName] = useState('Nguyễn Văn An');
  const [grade, setGrade] = useState('Lớp 10');

  const adjustGoal = (amount: number) => {
    setGoalMinutes((prev) => Math.max(15, Math.min(180, prev + amount)));
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div className={styles.profileCard}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarImageWrapper}>
              <img
                className={styles.avatarImage}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPXORE5frg-gSF48tPqNsK7u-BpPJXsK9BTmOfNmDRpEzYaCyp_Vuov02GKOpKK347WGOZK-KnElyonFikGDpShmJdnw_QdyucjDD463LTBTPlBsiXbCiM90RhSbzvGxsC5VnoUwNI7WOxLX6m957yyEbfAOo2_8m3B2YDgs3-hfWF7JgWgCvQuPFGRWumGqzK9THsZrcJbRbGDeyiwfKb2On4whKEU0zSRkjYB7ECnaiMSOx_OzIc"
                alt="Avatar"
              />
            </div>
            <button className={styles.editAvatarBtn} title="Đổi ảnh đại diện">
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            </button>
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <span className={styles.name}>{name}</span>
              <span className={styles.verifiedIcon}>verified</span>
              <span className={styles.schoolYearBadge}>
                <span className="material-symbols-outlined text-[13px]">school</span>
                <span>Niên khóa 2024 - 2027</span>
              </span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailItem}>
                <span className="material-symbols-outlined text-[16px] text-secondary">school</span>
                <span>{grade} • THPT Chuyên Hà Nội - Amsterdam</span>
              </span>
              <span className={styles.detailItem}>
                <span className="material-symbols-outlined text-[16px] text-secondary">fingerprint</span>
                Mã định danh: <span className="font-semibold text-on-surface">HS-2025-8869</span>
              </span>
            </div>
            <div className={styles.emailRow}>
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>Email tài khoản cố định:</span>
              <span className={styles.emailText}>hocsinh@example.com</span>
            </div>
          </div>
        </div>

        <div className={styles.actionSection}>
          {!isEditMode ? (
            <button className={styles.actionBtnPrimary} onClick={toggleEditMode}>
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              Chỉnh sửa hồ sơ
            </button>
          ) : (
            <>
              <button className={styles.actionBtnSecondary} onClick={toggleEditMode}>Hủy</button>
              <button className={styles.actionBtnPrimary} onClick={toggleEditMode}>
                <span className="material-symbols-outlined text-[18px]">check</span>
                Lưu thay đổi
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.bentoGrid}>
        {/* XP Card */}
        <div className={`${styles.bentoCard} ${styles.bentoCardDefault}`}>
          <div className={styles.bentoHeader}>
            <span className={`${styles.bentoTitle} ${styles.bentoTitleDefault}`}>Điểm tích lũy</span>
            <div className={`${styles.bentoIconWrapper} ${styles.bentoIconPrimary}`}>
              <span className="material-symbols-outlined text-[16px]">bolt</span>
            </div>
          </div>
          <div>
            <div className={styles.bentoValueDefault}>
              1,250 <span className="text-[13px] font-normal text-secondary">/ 1,500 XP</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div className={styles.progressBarFill} style={{ width: '83%' }}></div>
            </div>
          </div>
          <span className={`${styles.bentoFooter} ${styles.bentoFooterPrimary}`}>Còn 250 XP để thăng Cấp 5</span>
        </div>

        {/* Level Card */}
        <div className={`${styles.bentoCard} ${styles.bentoCardDefault}`}>
          <div className={styles.bentoHeader}>
            <span className={`${styles.bentoTitle} ${styles.bentoTitleDefault}`}>Cấp độ hiện tại</span>
            <div className={`${styles.bentoIconWrapper} ${styles.bentoIconSecondary}`}>
              <span className="material-symbols-outlined text-[16px]">military_tech</span>
            </div>
          </div>
          <div>
            <div className={styles.bentoValueSmall}>Cấp 4</div>
            <div className={`${styles.bentoSubtitle} ${styles.bentoSubtitleSecondary}`}>Học sinh Chuyên Cần</div>
          </div>
          <span className={`${styles.bentoFooter} ${styles.bentoFooterSecondary}`}>Hạng 12 trong toàn trường</span>
        </div>

        {/* Streak Card */}
        <div className={`${styles.bentoCard} ${styles.bentoCardHighlight}`}>
          <div className={styles.bentoHeader}>
            <span className={`${styles.bentoTitle} ${styles.bentoTitleHighlight}`}>Chuỗi ngày học</span>
            <div className={`${styles.bentoIconWrapper} ${styles.bentoIconTertiary}`}>
              <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
            </div>
          </div>
          <div>
            <div className={styles.bentoValueHighlight}>
              14 Ngày <span className="text-base">🔥</span>
            </div>
            <div className={`${styles.bentoSubtitle} ${styles.bentoSubtitleHighlight}`}>Duy trì xuất sắc!</div>
          </div>
          <span className={`${styles.bentoFooter} ${styles.bentoFooterHighlight}`}>Mục tiêu: Đạt huy hiệu 30 ngày</span>
        </div>

        {/* Last Active */}
        <div className={`${styles.bentoCard} ${styles.bentoCardDefault}`}>
          <div className={styles.bentoHeader}>
            <span className={`${styles.bentoTitle} ${styles.bentoTitleDefault}`}>Hoạt động gần nhất</span>
            <div className={`${styles.bentoIconWrapper} ${styles.bentoIconNeutral}`}>
              <span className="material-symbols-outlined text-[16px]">history_toggle_off</span>
            </div>
          </div>
          <div>
            <div className={styles.bentoValueMedium}>Hôm nay, 10:45 AM</div>
            <div className={`${styles.bentoSubtitle} ${styles.bentoSubtitleNeutral}`}>Giải 5 bài tập Hình học 10</div>
          </div>
          <span className={`${styles.bentoFooter} ${styles.bentoFooterPrimary} flex items-center gap-1`}>
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            Đang trực tuyến
          </span>
        </div>
      </div>

      <div className={styles.mainContentGrid}>
        {/* VIEW MODE */}
        {!isEditMode ? (
          <>
            <div className={styles.mainColumn}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrapper}>
                    <div className={`${styles.cardIconWrapper} ${styles.cardIconPrimary}`}>
                      <span className="material-symbols-outlined text-[18px]">badge</span>
                    </div>
                    <h2 className={styles.cardTitle}>Thông tin cá nhân & Tài khoản</h2>
                  </div>
                  <span className={`${styles.cardBadge} ${styles.cardBadgeSecondary}`}>Hệ thống SGK 2018</span>
                </div>
                <div className={styles.infoRowContainer}>
                  <div className={styles.infoRow}>
                    <div className={styles.infoRowCol}>
                      <span className={styles.infoLabel}>Họ và tên học sinh</span>
                      <span className={styles.infoValue}>{name}</span>
                    </div>
                    <span className={styles.infoIcon}>person</span>
                  </div>
                  <div className={styles.infoRow}>
                    <div className={styles.infoRowCol}>
                      <span className={styles.infoLabel}>Khối lớp theo học</span>
                      <span className={styles.infoValue}>{grade} (Chương trình mới)</span>
                    </div>
                    <span className={styles.infoIcon}>menu_book</span>
                  </div>
                  <div className={styles.infoRow}>
                    <div className={styles.infoRowCol}>
                      <div className="flex items-center gap-1.5">
                        <span className={styles.infoLabel}>Email đăng nhập chính</span>
                        <span className="material-symbols-outlined text-[14px] text-secondary">lock</span>
                      </div>
                      <span className={styles.infoValue}>hocsinh@example.com</span>
                      <span className={styles.infoDesc}>Đã xác minh qua Google OTP. Không thể đổi trực tiếp.</span>
                    </div>
                    <span className={styles.infoIcon}>mail</span>
                  </div>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoGridItem}>
                      <span className={styles.infoLabel}>Mã học sinh</span>
                      <span className={styles.infoValueSmall}>HS-2025-8869</span>
                    </div>
                    <div className={styles.infoGridItem}>
                      <span className={styles.infoLabel}>Ngày tham gia</span>
                      <span className={styles.infoValueSmall}>15/09/2024</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.mainColumn}>
              <div className={`${styles.card} h-full`}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrapper}>
                    <div className={`${styles.cardIconWrapper} ${styles.cardIconSecondary}`}>
                      <span className="material-symbols-outlined text-[18px]">psychology</span>
                    </div>
                    <h2 className={styles.cardTitle}>Tùy chọn học tập cá nhân hóa</h2>
                  </div>
                  <span className={`${styles.cardBadge} ${styles.cardBadgePrimary}`}>AI Đồng hành</span>
                </div>
                <div className="flex flex-col gap-2 p-space-md rounded-lg bg-surface-container-low">
                  <span className={`${styles.infoLabel} font-medium`}>Môn học ưu tiên luyện tập</span>
                  <div className={styles.chipContainer}>
                    <span className={styles.chip}>
                      <span className="material-symbols-outlined text-[14px]">calculate</span> Toán học
                    </span>
                    <span className={styles.chip}>
                      <span className="material-symbols-outlined text-[14px]">science</span> Vật lý
                    </span>
                  </div>
                </div>
                <div className={styles.goalBanner}>
                  <div className={styles.goalLeft}>
                    <div className={styles.goalIconWrapper}>
                      <span className="material-symbols-outlined text-[22px]">hourglass_top</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`${styles.infoLabel} font-medium`}>Mục tiêu học mỗi ngày</span>
                      <span className="font-body-md text-[16px] font-bold text-on-surface">{goalMinutes} phút / ngày</span>
                    </div>
                  </div>
                  <span className="font-label-sm text-[12px] text-primary font-semibold bg-surface-container-lowest px-3 py-1 rounded-lg shadow-sm">
                    Khuyến nghị chuẩn
                  </span>
                </div>
                <div className={styles.preferenceCard}>
                  <span className={`${styles.infoLabel} font-medium`}>Phong cách giải thích AI ưa thích</span>
                  <div className={styles.preferenceItem}>
                    <div className={styles.preferenceIconWrapper}>
                      <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-md text-[14px] font-semibold text-on-surface">Giải thích từng bước chi tiết (Step-by-step)</span>
                      <span className={styles.formHint}>Phù hợp học sinh ôn tập SGK và nắm chắc bản chất công thức.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* EDIT MODE */
          <div className="col-span-full flex flex-col gap-space-lg">
            <div className={styles.editBanner}>
              <div className={styles.editBannerLeft}>
                <div className={styles.editBannerIconWrapper}>
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </div>
                <div>
                  <div className={styles.editBannerTitle}>Bạn đang ở chế độ chỉnh sửa hồ sơ</div>
                  <div className={styles.editBannerDesc}>Hãy cập nhật thông tin học tập chính xác và nhấn Lưu thay đổi bên dưới.</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-7 flex flex-col gap-space-lg">
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleWrapper}>
                      <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                      <h2 className={styles.cardTitle}>Trường thông tin được phép chỉnh sửa</h2>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Họ và tên học sinh <span className="text-error">*</span></label>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                    />
                    <span className={styles.formHint}>Nhập đầy đủ họ và tên thật để hiển thị đúng chuẩn.</span>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Khối lớp hiện tại <span className="text-error">*</span></label>
                    <div className="relative">
                      <select 
                        className={styles.formSelect} 
                        value={grade} 
                        onChange={(e) => setGrade(e.target.value)}
                      >
                        <option value="Lớp 10">Lớp 10 (Bộ SGK Kết nối tri thức & Cánh diều)</option>
                        <option value="Lớp 11">Lớp 11 (Chương trình GDPT mới)</option>
                        <option value="Lớp 12">Lớp 12 (Ôn thi THPT Quốc gia)</option>
                        <option value="Khác">Khác / Thí sinh tự do</option>
                      </select>
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px] absolute right-3 top-3 pointer-events-none">expand_more</span>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mục tiêu học mỗi ngày (Thời lượng luyện đề)</label>
                    <div className={styles.stepper}>
                      <button className={styles.stepperBtn} onClick={() => adjustGoal(-15)}>
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <div className="flex items-baseline gap-1 px-space-sm">
                        <span className="font-headline-lg text-[22px] font-bold text-primary">{goalMinutes}</span>
                        <span className="font-label-sm text-label-sm font-medium text-secondary">phút / ngày</span>
                      </div>
                      <button className={styles.stepperBtn} onClick={() => adjustGoal(15)}>
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-space-lg">
                <div className={styles.readOnlyCard}>
                  <div className={styles.readOnlyHeader}>
                    <span className="material-symbols-outlined text-secondary text-[20px]">lock</span>
                    <h3 className={styles.readOnlyTitle}>Thông tin bảo mật cố định (Read-Only)</h3>
                  </div>
                  <p className={styles.readOnlyDesc}>Các trường thông tin này được bảo vệ nhằm đảm bảo tính toàn vẹn dữ liệu học bạ và thứ hạng bảng vàng.</p>
                  <div className="flex flex-col gap-space-sm">
                    <div className={styles.readOnlyItem}>
                      <div className="flex flex-col">
                        <span className={styles.formHint}>Email đăng nhập Google</span>
                        <span className={styles.infoValueSmall}>hocsinh@example.com</span>
                      </div>
                      <div className={styles.readOnlyBadge}>
                        <span className="material-symbols-outlined text-[13px]">lock</span>
                        Không được sửa
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
