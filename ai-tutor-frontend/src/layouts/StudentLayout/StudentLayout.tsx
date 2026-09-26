import React from 'react';
import { Outlet } from 'react-router-dom';
import { StudentHeader } from './components/StudentHeader/StudentHeader';
import { styles } from './StudentLayout.styles';

export const StudentLayout: React.FC = () => {
  return (
    <div className={styles.layout}>
      <StudentHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};
