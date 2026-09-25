import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { styles } from './StudentHeader.styles';

export const StudentHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getNavLinkClass = (path: string) => {
    return location.pathname.includes(path) ? styles.navLinkActive : styles.navLink;
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo & Main Navigation */}
        <div className={styles.navGroup}>
          <a className={styles.logoLink} href="#">
            <div className={styles.logoIconWrapper}>
              <span className={styles.logoIcon} style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <span className={styles.logoText}>AI Tutor</span>
          </a>
          {/* Desktop Navigation Links */}
          <nav className={styles.navLinks}>
            <Link className={getNavLinkClass('/student/dashboard')} to="/student/dashboard">Trang chủ</Link>
            <Link className={getNavLinkClass('/student/timetable')} to="/student/timetable">Thời khóa biểu</Link>
            <Link className={styles.navLink} to="#">Hỏi đáp SGK</Link>
            <Link className={styles.navLink} to="#">Luyện đề</Link>
            <Link className={styles.navLink} to="#">Bảng vàng</Link>
            <Link className={getNavLinkClass('/student/profile')} to="/student/profile">Hồ sơ cá nhân</Link>
          </nav>
        </div>
        
        {/* Trailing Action: Student Profile & Stats */}
        <div className={styles.actionGroup}>
          {/* Streak badge */}
          <div className={styles.streakBadge}>
            <span className={styles.streakIcon} style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className={styles.streakCount}>14</span>
            <span className={styles.streakLabel}>ngày</span>
          </div>
          
          {/* XP Badge */}
          <div className={styles.xpBadge}>
            <span className={styles.xpIcon} style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <span className="">1,250 XP</span>
          </div>
          
          {/* Notification Bell */}
          <button className={styles.notificationBtn} title="Thông báo">
            <span className="material-symbols-outlined">notifications</span>
            <span className={styles.notificationDot}></span>
          </button>
          
          {/* Quick AI Scanner Button */}
          <button className={styles.scannerBtn} onClick={() => navigate('/student/timetable')}>
            <span className={styles.scannerIcon} style={{ fontVariationSettings: "'FILL' 1" }}>document_scanner</span>
            <span className="">Quét TKB</span>
          </button>
          
          {/* Profile Chip */}
          <div className={styles.profileChip}>
            <img className={styles.profileAvatar} alt="Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2kipIr3-Rta9JHZ3VanqgaI4hWi1ryv7w2XdHDPCVIsar5hiAaTXoDoh_HMbv2jsN-bgK7gRrjLz_fphFGXfWwYtyeztIql-e9AdQsIfiUt0tzsI3h8ilFl_84mF2PhSQv38QK9cDx_JNtCdWFcR2BCNAMYUC24ecvbsUweZtxtDRn0wocKiKEXSQsPhpBFkIYPrnhnwad48sM4_d69eXVSq3aWci2OY2vm-Lty4LAo1hkj94z8IsbA" />
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>Nguyễn Văn An</p>
              <p className={styles.profileClass}>Lớp 10A1 - THPT Chuyên</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
