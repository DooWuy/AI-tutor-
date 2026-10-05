import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { styles } from './StudentHeader.styles';
import { logout, getStoredSession } from '../../../../services/authApi';
import { useWebSocket } from '../../../../hooks/useWebSocket';
import type { Notification as AppNotification } from '../../../../services/notificationApi';
import { 
  getMyNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../../../../services/notificationApi';
import { getMyStudentProfile } from '../../../../services/studentProfileApi';
import type { StudentProfile } from '../../../../types/studentProfile';

export const StudentHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const session = getStoredSession();
  const user = session ? session.user : null;
  const token = session ? session.accessToken : null;
  const fullName = studentProfile?.fullName || user?.fullName || 'Người dùng';
  const avatarUrl = studentProfile?.avatarUrl || user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0A5EB0&color=fff`;

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch initial notifications and profile
  useEffect(() => {
    if (user) {
      getMyNotifications().then(setNotifications).catch(console.error);
      getMyStudentProfile().then(setStudentProfile).catch(console.error);
    }
  }, [user]);

  // WebSocket hook
  const { lastMessage } = useWebSocket(token);

  useEffect(() => {
    if (lastMessage) {
      setNotifications(prev => [lastMessage, ...prev]);
      
      // Trigger Browser Push Notification if page is hidden
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        new window.Notification(lastMessage.title, {
          body: lastMessage.message,
          icon: '/favicon.ico'
        });
      }
    }
  }, [lastMessage]);

  useEffect(() => {
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }
    setIsNotificationOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const getNavLinkClass = (path: string) => {
    return location.pathname.includes(path) ? styles.navLinkActive : styles.navLink;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className={styles.header} ref={mobileMenuRef}>
      <div className={styles.container}>
        {/* Logo & Main Navigation */}
        <div className={styles.navGroup}>
          <button 
            className="md:hidden p-1.5 -ml-2 text-on-surface hover:text-primary transition rounded-lg hover:bg-surface-container"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          
          <a className={styles.logoLink} href="#">
            <div className={styles.logoIconWrapper}>
              <span className={styles.logoIcon} style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <span className={styles.logoText}>AI Tutor</span>
          </a>
          <nav className={styles.navLinks}>
            <Link className={getNavLinkClass('/student/dashboard')} to="/student/dashboard">Trang chủ</Link>
            <Link className={getNavLinkClass('/student/timetable')} to="/student/timetable">Thời khóa biểu</Link>
            <Link className={getNavLinkClass('/student/chat')} to="/student/chat">Hỏi đáp SGK</Link>
            <Link className={styles.navLink} to="#">Luyện đề</Link>
            <Link className={styles.navLink} to="#">Bảng vàng</Link>
          </nav>
        </div>
        
        {isMobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <Link className={location.pathname.includes('/student/dashboard') ? styles.mobileMenuItemActive : styles.mobileMenuItem} to="/student/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Trang chủ</Link>
            <Link className={location.pathname.includes('/student/timetable') ? styles.mobileMenuItemActive : styles.mobileMenuItem} to="/student/timetable" onClick={() => setIsMobileMenuOpen(false)}>Thời khóa biểu</Link>
            <Link className={location.pathname.includes('/student/chat') ? styles.mobileMenuItemActive : styles.mobileMenuItem} to="/student/chat" onClick={() => setIsMobileMenuOpen(false)}>Hỏi đáp SGK</Link>
            <Link className={styles.mobileMenuItem} to="#" onClick={() => setIsMobileMenuOpen(false)}>Luyện đề</Link>
            <Link className={styles.mobileMenuItem} to="#" onClick={() => setIsMobileMenuOpen(false)}>Bảng vàng</Link>
          </div>
        )}
        
        {/* Trailing Action: Student Profile & Stats */}
        <div className={styles.actionGroup}>
          {/* Streak badge */}
          <div className={styles.streakBadge}>
            <span className={styles.streakIcon} style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className={styles.streakCount}>{studentProfile?.currentStreak || 0}</span>
            <span className={styles.streakLabel}>ngày</span>
          </div>
          
          {/* XP Badge */}
          <div className={styles.xpBadge}>
            <span className={styles.xpIcon} style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <span className="">{studentProfile?.totalXp?.toLocaleString() || 0} XP</span>
          </div>
          
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
            <div className={styles.profileChip} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <img className={styles.profileAvatar} alt="Profile" src={avatarUrl} />
              <div className={styles.profileInfo}>
                <p className={styles.profileName}>{fullName}</p>
                <p className={styles.profileClass}>
                  {studentProfile?.className ? `Lớp ${studentProfile.className}` : 'Chưa cập nhật lớp'}
                  {studentProfile?.schoolName ? ` - ${studentProfile.schoolName}` : ''}
                </p>
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

