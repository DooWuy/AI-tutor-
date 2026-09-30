import { useNavigate } from 'react-router-dom';
import { logout } from '../../../services/authApi';
import type { User } from '../../../types/auth';
import { styles } from '../TeacherLayout.styles';

interface TeacherHeaderProps {
  user: User | null;
}

export function TeacherHeader({ user }: TeacherHeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.fullName || user?.username || 'Giáo viên';
  const roleName = user?.role === 'ADMIN' ? 'Ban Giám Hiệu' : 'Giáo viên Phụ trách';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'GV';

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        {/* Brand */}
        <div className={styles.headerBrand}>
          <div className={styles.headerLogoIcon}>
            <span className="material-symbols-outlined text-[22px]">school</span>
          </div>
          <div className={styles.headerBrandText}>
            <span className={styles.headerTitle}>AI Tutor Platform</span>
            <span className={styles.headerBadge}>Teacher Portal</span>
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className={styles.headerRight}>
          <div className={styles.headerUserInfo}>
            <span className={styles.headerUserName}>{displayName}</span>
            <span className={styles.headerUserRole}>{roleName}</span>
          </div>

          <div className={styles.headerAvatar}>
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className={styles.headerLogoutBtn}
            title="Đăng xuất"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
}
