import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { getStoredSession } from '../../services/authApi';
import type { User } from '../../types/auth';
import { TeacherHeader } from './components/TeacherHeader';
import { TeacherSidebar } from './components/TeacherSidebar';
import { styles } from './TeacherLayout.styles';

export function TeacherLayout() {
  const [currentUser] = useState<User | null>(() => getStoredSession()?.user ?? null);
  const navigate = useNavigate();

  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }

    if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className={styles.layout}>
      <TeacherHeader user={currentUser} />
      <div className={styles.bodyWrapper}>
        <TeacherSidebar />
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
