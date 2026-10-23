import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';

import { StudentLayout } from './layouts/StudentLayout/StudentLayout';
import { TeacherLayout } from './layouts/TeacherLayout/TeacherLayout';
import { AdminLayout } from './layouts/AdminLayout/AdminLayout';

import { MaintenanceOverlay } from './components/common/MaintenanceOverlay';
import { AlertProvider } from './context/AlertContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { Spinner } from './components/common/Spinner';

// Lazy-loaded Pages (Code-splitting for optimal bundle size and fast initial load)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Register/RegisterPage'));

// Student Pages
const DashboardPage = lazy(() => import('./pages/Student/Dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProgressPage = lazy(() => import('./pages/Student/Progress/ProgressPage').then(m => ({ default: m.ProgressPage })));
const TimetablePage = lazy(() => import('./pages/Student/Timetable/TimetablePage').then(m => ({ default: m.TimetablePage })));
const ProfilePage = lazy(() => import('./pages/Student/Profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AIChatPage = lazy(() => import('./pages/Student/AIChat/AIChatPage').then(m => ({ default: m.AIChatPage })));
const PracticePage = lazy(() => import('./pages/Student/Practice/PracticePage').then(m => ({ default: m.PracticePage })));
const PracticeTopicPage = lazy(() => import('./pages/Student/Practice/PracticeTopicPage').then(m => ({ default: m.PracticeTopicPage })));
const QuizAttemptPage = lazy(() => import('./pages/Student/Practice/QuizAttemptPage').then(m => ({ default: m.QuizAttemptPage })));
const QuizResultPage = lazy(() => import('./pages/Student/Practice/QuizResultPage').then(m => ({ default: m.QuizResultPage })));
const JoinStudyClassPage = lazy(() => import('./pages/Student/Classes/JoinStudyClassPage'));

// Teacher Pages
const AnalyticsPage = lazy(() => import('./pages/Teacher/Analytics/AnalyticsPage'));
const TeachingMaterialsPage = lazy(() => import('./pages/Teacher/TeachingMaterials/TeachingMaterialsPage'));
const ClassesPage = lazy(() => import('./pages/Teacher/Classes/ClassesPage'));
const ClassDetailPage = lazy(() => import('./pages/Teacher/Classes/ClassDetailPage'));
const TeacherStudentDetailPage = lazy(() => import('./pages/Teacher/Classes/TeacherStudentDetailPage'));
const StudyClassDetailPage = lazy(() => import('./pages/Teacher/Classes/StudyClassDetailPage'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('./pages/Admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminStudentDetailShell = lazy(() => import('./pages/Admin/Students/AdminStudentDetailShell').then(m => ({ default: m.AdminStudentDetailShell })));
const StudentManagementPage = lazy(() => import('./pages/Admin/Students/StudentManagementPage').then(m => ({ default: m.StudentManagementPage })));
const SkillsManagementPage = lazy(() => import('./pages/Admin/Skills/SkillsManagementPage').then(m => ({ default: m.SkillsManagementPage })));
const SystemSettingsPage = lazy(() => import('./pages/Admin/Settings/SystemSettingsPage').then(m => ({ default: m.SystemSettingsPage })));
const SystemLogsPage = lazy(() => import('./pages/Admin/Logs/SystemLogsPage').then(m => ({ default: m.SystemLogsPage })));

// Assessment & Quiz Shared Pages
const QuestionBankPage = lazy(() => import('./pages/Assessment/QuestionBankPage'));
const SubjectSkillsPage = lazy(() => import('./pages/Assessment/SubjectSkillsPage'));
const SkillQuestionsPage = lazy(() => import('./pages/Assessment/SkillQuestionsPage'));
const QuizListPage = lazy(() => import('./pages/Assessment/QuizListPage'));
const QuizEditorPage = lazy(() => import('./pages/Assessment/QuizEditorPage'));
const QuizStatisticsPage = lazy(() => import('./pages/Assessment/QuizStatisticsPage'));

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" color="primary" />
        <p className="text-sm font-medium text-on-surface-variant animate-pulse">Đang tải...</p>
      </div>
    </div>
  );
}

function QuizStatisticsRedirect() {
  const { quizId } = useParams<{ quizId: string }>();
  return <Navigate to={`/teacher/quizzes/${quizId}/statistics`} replace />;
}

function App() {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AlertProvider>
              <ToastProvider>
                <NotificationProvider>
                  <MaintenanceOverlay />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/quizzes/:quizId/statistics" element={<QuizStatisticsRedirect />} />
                      
                      {/* Student Routes */}
                      <Route path="/student" element={<StudentLayout />}>
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="progress" element={<ProgressPage />} />
                        <Route path="timetable" element={<TimetablePage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="classes" element={<JoinStudyClassPage />} />
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
                        <Route path="classes" element={<ClassesPage />} />
                        <Route path="study-classes/:classId/students/:studentId" element={<TeacherStudentDetailPage />} />
                        <Route path="study-classes/:classId" element={<StudyClassDetailPage />} />
                        <Route path="classes/:classId" element={<ClassDetailPage />} />
                        <Route path="classes/:classId/students/:studentId" element={<TeacherStudentDetailPage />} />
                        <Route path="question-bank" element={<QuestionBankPage />} />
                        <Route path="question-bank/:subject/:grade" element={<SubjectSkillsPage />} />
                        <Route path="question-bank/:skillId" element={<SkillQuestionsPage />} />
                        <Route path="quizzes" element={<QuizListPage />} />
                        <Route path="quizzes/new" element={<QuizEditorPage />} />
                        <Route path="quizzes/:quizId/statistics" element={<QuizStatisticsPage />} />
                        <Route path="quizzes/:quizId" element={<QuizEditorPage />} />
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
                        <Route path="skills" element={<SkillsManagementPage />} />
                        <Route path="settings" element={<SystemSettingsPage />} />
                        <Route path="logs" element={<SystemLogsPage />} />
                        <Route path="question-bank" element={<QuestionBankPage />} />
                        <Route path="question-bank/:subject/:grade" element={<SubjectSkillsPage />} />
                        <Route path="question-bank/:skillId" element={<SkillQuestionsPage />} />
                        <Route path="quizzes" element={<QuizListPage />} />
                        <Route path="quizzes/new" element={<QuizEditorPage />} />
                        <Route path="quizzes/:quizId/statistics" element={<QuizStatisticsPage />} />
                        <Route path="quizzes/:quizId" element={<QuizEditorPage />} />
                      </Route>
                    </Routes>
                  </Suspense>
                  </NotificationProvider>
                </ToastProvider>
      </AlertProvider>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
