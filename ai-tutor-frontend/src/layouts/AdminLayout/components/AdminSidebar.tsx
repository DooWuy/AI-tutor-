import {
  BookOpen,
  Cpu,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
  X,
  Zap,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { styles } from '../AdminLayout.styles';

interface AdminSidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  end?: boolean;
  badge?: string;
  isPlaceholder?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Bảng điều khiển',
    items: [
      {
        to: '/admin/dashboard',
        label: 'Tổng quan hệ thống',
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    title: 'Quản lý đào tạo',
    items: [
      {
        to: '/admin/students',
        label: 'Quản lý học sinh',
        icon: GraduationCap,
      },
      {
        to: '/admin/users',
        label: 'Tài khoản người dùng',
        icon: UserCog,
        badge: 'Sắp có',
        isPlaceholder: true,
      },
      {
        to: '/admin/documents',
        label: 'Kho tài liệu & Sách',
        icon: BookOpen,
        badge: 'Sắp có',
        isPlaceholder: true,
      },
      {
        to: '/admin/quizzes',
        label: 'Ngân hàng đề thi & Quiz',
        icon: HelpCircle,
        badge: 'Sắp có',
        isPlaceholder: true,
      },
    ],
  },
  {
    title: 'Hệ thống & Trí tuệ AI',
    items: [
      {
        to: '/admin/ai-settings',
        label: 'Cấu hình AI Agent',
        icon: Cpu,
        badge: 'Pro',
        isPlaceholder: true,
      },
      {
        to: '/admin/audit',
        label: 'Nhật ký bảo mật & Audit',
        icon: ShieldCheck,
        badge: 'Sắp có',
        isPlaceholder: true,
      },
    ],
  },
];

export function AdminSidebar({ mobile = false, onClose }: AdminSidebarProps) {
  return (
    <aside className={mobile ? styles.mobileSidebar : styles.sidebar} aria-label="Điều hướng quản trị">
      <div className="overflow-y-auto pr-1">
        {mobile && (
          <div className={styles.mobileSidebarHeader}>
            <span className="text-sm font-bold text-slate-900">Menu quản trị</span>
            <button className={styles.closeButton} type="button" onClick={onClose} aria-label="Đóng menu quản trị">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}

        {navSections.map((section) => (
          <div key={section.title} className={styles.navGroup}>
            <p className={styles.navSectionTitle}>{section.title}</p>
            <nav className={styles.nav}>
              {section.items.map(({ to, label, icon: Icon, end, badge, isPlaceholder }) =>
                isPlaceholder ? (
                  <div
                    key={to}
                    className={`${styles.navLink} cursor-not-allowed opacity-60 hover:bg-transparent`}
                    aria-disabled="true"
                    title={`${label} đang trong lộ trình phát triển`}
                  >
                    <div className={styles.navItemContent}>
                      <Icon size={18} className={styles.navIcon} />
                      <span className="truncate">{label}</span>
                    </div>
                    <span className={styles.navBadge}>{badge}</span>
                  </div>
                ) : (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onClose}
                    className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
                  >
                    {({ isActive }) => (
                      <>
                        <div className={styles.navItemContent}>
                          <Icon size={18} className={isActive ? styles.navIconActive : styles.navIcon} />
                          <span className="truncate">{label}</span>
                        </div>
                        {badge && (
                          <span className={isActive ? styles.navBadgeActive : styles.navBadge}>
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              )}
            </nav>
          </div>
        ))}
      </div>

      <div className={styles.sidebarFooter}>
        <div className={styles.systemStatusCard}>
          <div className="flex items-center justify-between text-slate-800 font-bold">
            <span className="flex items-center gap-1.5">
              <Zap size={13} className="text-[#005cb8]" /> AI Cluster Core
            </span>
            <span className="text-[10px] text-emerald-600 bg-emerald-100/80 px-1.5 py-0.5 rounded font-bold">
              99.9% Up
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            Hạ tầng RAG & LLM sẵn sàng phục vụ học sinh 24/7.
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>AI Tutor Admin v1.2</span>
          <span>Build 2026.10</span>
        </div>
      </div>
    </aside>
  );
}
