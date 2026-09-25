import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { styles } from './StudentHeader.styles';
import { logout, getStoredSession } from '../../../../services/authApi';

export const StudentHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const session = getStoredSession();
  const user = session ? session.user : null;
  const fullName = user?.fullName || 'Người dùng';
  const avatarUrl = user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0A5EB0&color=fff`;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
          
          {/* Profile Chip & Dropdown */}
          <div className={styles.profileChipWrapper} ref={dropdownRef}>
            <div className={styles.profileChip} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <img className={styles.profileAvatar} alt="Profile" src={avatarUrl} />
              <div className={styles.profileInfo}>
                <p className={styles.profileName}>{fullName}</p>
                <p className={styles.profileClass}>Lớp 10A1 - THPT Chuyên</p>
              </div>
            </div>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <div 
                  className={styles.dropdownItem} 
                  onClick={() => { setIsDropdownOpen(false); navigate('/student/profile'); }}
                >
                  <span className={styles.dropdownIcon}>person</span>
                  <span>Hồ sơ cá nhân</span>
                </div>
                <div className={styles.dropdownDivider}></div>
                <div className={styles.dropdownItem} onClick={handleLogout}>
                  <span className={`${styles.dropdownIcon} text-error`}>logout</span>
                  <span className="text-error font-medium">Đăng xuất</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
