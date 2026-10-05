import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getStoredSession } from '../../services/authApi';
import { styles } from './AdminLayout.styles';
import { AdminHeader } from './components/AdminHeader';
import { AdminSidebar } from './components/AdminSidebar';

function roleHome(role: string) {
  if (role === 'STUDENT') return '/student/dashboard';
  if (role === 'TEACHER') return '/teacher/analytics';
  return '/login';
}

export function AdminLayout() {
  const session = getStoredSession();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileMenuOpen]);

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (session.user.role !== 'ADMIN') return <Navigate to={roleHome(session.user.role)} replace />;

  return (
    <div className={styles.layout}>
      <AdminHeader user={session.user} onOpenMenu={() => setMobileMenuOpen(true)} />
      <div className={styles.body}>
        <AdminSidebar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      {mobileMenuOpen && (
        <>
          <button className={styles.mobileBackdrop} type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Đóng menu quản trị" />
          <AdminSidebar mobile onClose={() => setMobileMenuOpen(false)} />
        </>
      )}
    </div>
  );
}
