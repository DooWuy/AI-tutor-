import React from 'react';
import { styles } from '../TimetablePage.styles';

interface TimetableBannerProps {
  tomorrowDayName: string;
}

export const TimetableBanner: React.FC<TimetableBannerProps> = ({ tomorrowDayName }) => {
  return (
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
              Phát hiện ngày mai <strong className="text-primary font-bold">({tomorrowDayName})</strong> có <span className="text-tertiary font-semibold underline decoration-tertiary decoration-2">1 bài kiểm tra 15 phút môn Hóa Học</span> và <span className="text-error font-semibold">2 bài tập Toán</span> chưa hoàn thành.
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
  );
};
