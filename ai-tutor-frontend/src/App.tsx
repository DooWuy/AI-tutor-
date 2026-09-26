import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';

import { StudentLayout } from './layouts/StudentLayout/StudentLayout';
import { DashboardPage } from './pages/Student/Dashboard/DashboardPage';
import { TimetablePage } from './pages/Student/Timetable/TimetablePage';
import { ProfilePage } from './pages/Student/Profile/ProfilePage';

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
