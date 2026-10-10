import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';

import { StudentLayout } from './layouts/StudentLayout/StudentLayout';
import { DashboardPage } from './pages/Student/Dashboard/DashboardPage';
import { TimetablePage } from './pages/Student/Timetable/TimetablePage';
import { ProfilePage } from './pages/Student/Profile/ProfilePage';
import { AIChatPage } from './pages/Student/AIChat/AIChatPage';
import { PracticePage } from './pages/Student/Practice/PracticePage';
import { PracticeTopicPage } from './pages/Student/Practice/PracticeTopicPage';
import { QuizAttemptPage } from './pages/Student/Practice/QuizAttemptPage';
import { QuizResultPage } from './pages/Student/Practice/QuizResultPage';

import { TeacherLayout } from './layouts/TeacherLayout/TeacherLayout';
import AnalyticsPage from './pages/Teacher/Analytics/AnalyticsPage';
import TeachingMaterialsPage from './pages/Teacher/TeachingMaterials/TeachingMaterialsPage';

import { AdminLayout } from './layouts/AdminLayout/AdminLayout';
import { AdminDashboardPage } from './pages/Admin/AdminDashboardPage';
import { AdminStudentDetailShell } from './pages/Admin/Students/AdminStudentDetailShell';
import { StudentManagementPage } from './pages/Admin/Students/StudentManagementPage';

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
          <Route path="chat" element={<AIChatPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="practice/:subjectId" element={<PracticeTopicPage />} />
          <Route path="quiz-attempt/:quizId" element={<QuizAttemptPage />} />
          <Route path="quiz-results/:attemptId" element={<QuizResultPage />} />
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

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/students" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="students" element={<StudentManagementPage />} />
          <Route path="students/:studentId" element={<AdminStudentDetailShell />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
