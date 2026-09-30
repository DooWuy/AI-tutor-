import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';

import { StudentLayout } from './layouts/StudentLayout/StudentLayout';
import { DashboardPage } from './pages/Student/Dashboard/DashboardPage';
import { TimetablePage } from './pages/Student/Timetable/TimetablePage';
import { ProfilePage } from './pages/Student/Profile/ProfilePage';
import { ReviewPage } from './pages/Student/Review/ReviewPage';

import { TeacherLayout } from './layouts/TeacherLayout/TeacherLayout';
import AnalyticsPage from './pages/Teacher/Analytics/AnalyticsPage';
import { Navigate } from 'react-router-dom';

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
          <Route path="review/:notificationId" element={<ReviewPage />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<Navigate to="/teacher/analytics" replace />} />
          <Route path="dashboard" element={<Navigate to="/teacher/analytics" replace />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
