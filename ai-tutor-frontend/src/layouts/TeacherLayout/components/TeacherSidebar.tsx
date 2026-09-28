import { NavLink } from 'react-router-dom';
import { styles } from '../TeacherLayout.styles';

export function TeacherSidebar() {
  const navItems = [
    {
      to: '/teacher/analytics',
      label: 'Bảng phân tích',
      subtitle: 'Analytics Dashboard',
      icon: 'insights',
    },
    {
      to: '/teacher/classes',
      label: 'Lớp học của tôi',
      subtitle: 'My Classes',
      icon: 'groups',
    },
    {
      to: '/teacher/quizzes',
      label: 'Ngân hàng đề thi',
      subtitle: 'Quiz Management',
      icon: 'quiz',
    },
    {
      to: '/teacher/documents',
      label: 'Tài liệu giảng dạy',
      subtitle: 'Teaching Materials',
      icon: 'menu_book',
    },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarSectionTitle}>Menu Nghiệp vụ</div>
      <nav className={styles.sidebarNavList}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? styles.sidebarNavLinkActive : styles.sidebarNavLinkInactive
            }
          >
            <span className={styles.sidebarIcon}>{item.icon}</span>
            <div className="flex flex-col min-w-0">
              <span className="truncate leading-snug">{item.label}</span>
              <span className="text-[10px] opacity-80 truncate">{item.subtitle}</span>
            </div>
          </NavLink>
        ))}
      </nav>

      {/* AI Tutor Assistant Hint */}
      <div className={styles.sidebarQuickNotice}>
        <div className={styles.sidebarNoticeTitle}>
          <span className="material-symbols-outlined text-primary text-[16px]">psychology</span>
          <span>AI Analytics Engine</span>
        </div>
        <p className="leading-relaxed">
          Dữ liệu bài kiểm tra & lịch sử tương tác AI được tự động đồng bộ hàng ngày để phát hiện nguy cơ học tập sớm.
        </p>
      </div>
    </aside>
  );
}
