import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TeacherHeader } from './components/TeacherHeader';
import { TeacherSidebar } from './components/TeacherSidebar';
import { styles } from './TeacherLayout.styles';

export function TeacherLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  return (
    <div className={styles.layout}>
      <TeacherHeader user={user} />
      <div className={styles.bodyWrapper}>
        <TeacherSidebar />
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
