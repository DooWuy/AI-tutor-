import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { StudentLearningProvider } from '../../context/StudentLearningContext';
import { useAuth } from '../../context/AuthContext';
import { StudentHeader } from './components/StudentHeader/StudentHeader';
import { styles } from './StudentLayout.styles';

export const StudentLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;
  if (!user || user.role !== 'STUDENT') return <Navigate to="/login" replace />;
  return (
    <StudentLearningProvider key={user.userId}>
    <div className={styles.layout}>
      <StudentHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
    </StudentLearningProvider>
  );
};
