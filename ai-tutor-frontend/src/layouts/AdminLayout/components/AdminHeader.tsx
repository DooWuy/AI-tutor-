import { Bell, Bot, LogOut, Menu, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../services/authApi';
import type { User } from '../../../types/auth';
import { styles } from '../AdminLayout.styles';

interface AdminHeaderProps {
  user: User;
  onOpenMenu: () => void;
}

export function AdminHeader({ user, onOpenMenu }: AdminHeaderProps) {
  const navigate = useNavigate();
  const displayName = user.fullName || user.username || 'Quản trị viên';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'AD';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.brand}>
          <button className={styles.menuButton} type="button" onClick={onOpenMenu} aria-label="Mở menu quản trị">
            <Menu size={18} aria-hidden="true" />
          </button>
          <div className={styles.brandMark} aria-hidden="true">
            <Bot size={22} className="text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className={styles.brandCopy}>
            <span className={styles.brandTitle}>
              AI Tutor <span className="text-[#005cb8]">Admin OS</span>
            </span>
            <span className={styles.brandLabel}>Trung tâm điều hành</span>
          </div>
        </div>

        {/* Global Quick Search Mockup / Status */}
        <div className={styles.headerCenter}>
          <div className={styles.searchBar}>
            <Sparkles size={14} className="text-[#005cb8]" />
            <span>Tìm kiếm học sinh, tài liệu, lớp học hoặc cài đặt...</span>
            <span className={styles.searchKbd}>⌘K</span>
          </div>
        </div>

        <div className={styles.userArea}>
          <div className={styles.systemStatusBadge}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Engine Online</span>
          </div>

          <button 
            type="button" 
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
            title="Thông báo hệ thống"
            aria-label="Thông báo hệ thống"
          >
            <Bell size={17} />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#005cb8] ring-2 ring-white" />
          </button>

          <div className={styles.userCopy}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userRoleBadge}>Quản trị viên cấp cao</span>
          </div>

          <div className={styles.avatar} title={displayName}>
            {user.avatarUrl ? <img className="h-full w-full object-cover" src={user.avatarUrl} alt="" /> : initials}
          </div>

          <button 
            className={styles.logoutButton} 
            type="button" 
            onClick={handleLogout} 
            title="Đăng xuất khỏi hệ thống" 
            aria-label="Đăng xuất"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
