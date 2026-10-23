import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { styles } from './StudentHeader.styles';
import { useAuth } from '../../../../context/AuthContext';
import { useNotification } from '../../../../context/NotificationContext';
import { ThemeToggle } from '../../../../components/common/ThemeToggle';
import type { Notification as AppNotification } from '../../../../services/notificationApi';
import { useStudentLearning } from '../../../../context/StudentLearningContext';

export const StudentHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { profile: profileResource } = useStudentLearning();
  const studentProfile = profileResource.data;
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const fullName = studentProfile?.fullName || user?.fullName || 'Người dùng';
  const avatarUrl = studentProfile?.avatarUrl || user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0A5EB0&color=fff`;

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false); setIsNotificationOpen(false); setIsMobileMenuOpen(false);
      }
    }
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEscape); };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setIsNotificationOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNavLinkClass = (path: string) => {
    return location.pathname.includes(path) ? styles.navLinkActive : styles.navLink;
  };

  return (
    <header className={styles.header} ref={mobileMenuRef}>
      <div className={styles.container}>
        {/* Logo & Main Navigation */}
        <div className={styles.navGroup}>
          <button 
            aria-label="Mở menu điều hướng" aria-expanded={isMobileMenuOpen} className="xl:hidden p-2.5 -ml-2 text-on-surface hover:text-primary transition rounded-lg hover:bg-surface-container"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          
          <Link className={styles.logoLink} to="/student/dashboard">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#004bb5] to-[#2575fc] text-white shadow-md shadow-[#005cb8]/20 ring-1 ring-white/20" aria-hidden="true">
              <Bot size={22} className="text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="motion-reduce:animate-none animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div className="min-w-0 flex flex-col justify-center hidden sm:flex">
              <span className="block truncate text-base font-bold tracking-tight text-on-surface flex items-center gap-1.5">
                AI Tutor <span className="text-[#005cb8]">Học sinh</span>
              </span>
              <span className="block text-[10px] font-extrabold uppercase tracking-widest leading-none text-[#005cb8] mt-0.5">
                Không gian học tập
              </span>
            </div>
          </Link>
          <nav className={styles.navLinks}>
            <Link className={getNavLinkClass('/student/dashboard')} to="/student/dashboard">Trang chủ</Link>
            <Link className={getNavLinkClass('/student/timetable')} to="/student/timetable">Thời khóa biểu</Link>
            <Link className={getNavLinkClass('/student/chat')} to="/student/chat">Hỏi đáp SGK</Link>
            <Link className={getNavLinkClass('/student/practice')} to="/student/practice">Luyện đề</Link>
            <Link className={getNavLinkClass('/student/progress')} to="/student/progress">Tiến độ</Link>
            <Link className={getNavLinkClass('/student/classes')} to="/student/classes">Lớp học</Link>
          </nav>
        </div>
        
        {isMobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <Link className={location.pathname.includes('/student/dashboard') ? styles.mobileMenuItemActive : styles.mobileMenuItem} to="/student/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Trang chủ</Link>
            <Link className={location.pathname.includes('/student/timetable') ? styles.mobileMenuItemActive : styles.mobileMenuItem} to="/student/timetable" onClick={() => setIsMobileMenuOpen(false)}>Thời khóa biểu</Link>
            <Link className={location.pathname.includes('/student/chat') ? styles.mobileMenuItemActive : styles.mobileMenuItem} to="/student/chat" onClick={() => setIsMobileMenuOpen(false)}>Hỏi đáp SGK</Link>
            <Link className={location.pathname.includes('/student/practice') ? styles.mobileMenuItemActive : styles.mobileMenuItem} to="/student/practice" onClick={() => setIsMobileMenuOpen(false)}>Luyện đề</Link>
            <Link className={location.pathname.includes('/student/progress') ? styles.mobileMenuItemActive : styles.mobileMenuItem} to="/student/progress" onClick={() => setIsMobileMenuOpen(false)}>Tiến độ</Link>
            <Link className={location.pathname.includes('/student/classes') ? styles.mobileMenuItemActive : styles.mobileMenuItem} to="/student/classes" onClick={() => setIsMobileMenuOpen(false)}>Lớp học</Link>
          </div>
        )}
        
        {/* Trailing Action: Student Profile & Stats */}
        <div className={styles.actionGroup}>
          {/* Streak badge */}
          <div className={styles.streakBadge}>
            <span className={styles.streakIcon} style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className={styles.streakCount}>{studentProfile ? studentProfile.currentStreak : '—'}</span>
            <span className={styles.streakLabel}>ngày</span>
          </div>
          
          {/* XP Badge */}
          <div className={styles.xpBadge}>
            <span className={styles.xpIcon} style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <span className="">{studentProfile ? studentProfile.totalXp.toLocaleString('vi-VN') : '—'} XP</span>
          </div>
          
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button 
              className={styles.notificationBtn} 
              title="Thông báo"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && <span className={styles.notificationDot}></span>}
            </button>
            
            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div className={styles.notificationDropdownMenu}>
                <div className={styles.notificationHeader}>
                  <span className={styles.notificationTitle}>Thông báo</span>
                  {unreadCount > 0 && (
                    <span 
                      className={styles.notificationMarkAllBtn}
                      onClick={handleMarkAllAsRead}
                    >
                      Đánh dấu đã đọc tất cả
                    </span>
                  )}
                </div>
                
                <div className={styles.notificationList}>
                  {notifications.length === 0 ? (
                    <div className={styles.notificationEmpty}>
                      <span className={styles.notificationEmptyIcon}>notifications_paused</span>
                      <span>Bạn chưa có thông báo nào</span>
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div 
                        key={notification.id}
                        className={`${styles.notificationItem} ${!notification.isRead ? styles.notificationItemUnread : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {!notification.isRead && <span className={styles.notificationUnreadDot}></span>}
                        <span className={styles.notificationItemTitle}>{notification.title}</span>
                        <span className={styles.notificationItemMessage}>{notification.message}</span>
                        <span className={styles.notificationItemTime}>
                          {new Date(notification.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Quick AI Scanner Button */}
          <button className={styles.scannerBtn} onClick={() => navigate('/student/timetable')}>
            <span className={styles.scannerIcon} style={{ fontVariationSettings: "'FILL' 1" }}>document_scanner</span>
            <span className="">Quét TKB</span>
          </button>
          
          {/* Profile Chip & Dropdown */}
          <div className={styles.profileChipWrapper} ref={dropdownRef}>
            <button type="button" aria-label="Mở menu tài khoản" aria-expanded={isDropdownOpen} className={styles.profileChip} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <img className={styles.profileAvatar} alt="Profile" src={avatarUrl} />
              <div className={styles.profileInfo}>
                <p className={styles.profileName}>{fullName}</p>
                <p className={styles.profileClass}>
                  {studentProfile?.className ? `Lớp ${studentProfile.className}` : 'Chưa cập nhật lớp'}
                  {studentProfile?.schoolName ? ` - ${studentProfile.schoolName}` : ''}
                </p>
              </div>
            </button>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button type="button"
                  className={styles.dropdownItem} 
                  onClick={() => { setIsDropdownOpen(false); navigate('/student/profile'); }}
                >
                  <span className={styles.dropdownIcon}>person</span>
                  <span>Hồ sơ cá nhân</span>
                </button>
                <div className={styles.dropdownDivider}></div>
                <button type="button" className={styles.dropdownItem} onClick={handleLogout}>
                  <span className={`${styles.dropdownIcon} text-error`}>logout</span>
                  <span className="text-error font-medium">Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

