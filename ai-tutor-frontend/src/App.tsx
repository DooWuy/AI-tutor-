import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';

import { StudentLayout } from './layouts/StudentLayout/StudentLayout';
import { DashboardPage } from './pages/Student/Dashboard/DashboardPage';
import { TimetablePage } from './pages/Student/Timetable/TimetablePage';
import { ProfilePage } from './pages/Student/Profile/ProfilePage';

import { TeacherLayout } from './layouts/TeacherLayout/TeacherLayout';
import AnalyticsPage from './pages/Teacher/Analytics/AnalyticsPage';
import TeachingMaterialsPage from './pages/Teacher/TeachingMaterials/TeachingMaterialsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Student Routes */}
        <Route path="/student" element={<StudentLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<Navigate to="/teacher/analytics" replace />} />
          <Route path="dashboard" element={<Navigate to="/teacher/analytics" replace />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="documents" element={<TeachingMaterialsPage />} />
          <Route path="materials" element={<Navigate to="/teacher/documents" replace />} />
          <Route path="curriculum" element={<Navigate to="/teacher/documents" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
