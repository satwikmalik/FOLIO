import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Portfolio from './pages/Portfolio.jsx';
import Explore from './pages/Explore.jsx';
import NotFound from './pages/NotFound.jsx';
import DashboardLayout from './pages/dashboard/DashboardLayout.jsx';
import ProfileEditor from './pages/dashboard/ProfileEditor.jsx';
import FoliosManager from './pages/dashboard/FoliosManager.jsx';
import FolioEditor from './pages/dashboard/FolioEditor.jsx';
import FolioPage from './pages/FolioPage.jsx';
import ProjectsManager from './pages/dashboard/ProjectsManager.jsx';
import SkillsManager from './pages/dashboard/SkillsManager.jsx';
import Inbox from './pages/dashboard/Inbox.jsx';
import AccountSettings from './pages/dashboard/AccountSettings.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/u/:username" element={<Portfolio />} />
        <Route path="/f/:slug" element={<FolioPage />} />
        <Route path="/demo/:slug" element={<FolioPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/explore" replace />} />
          <Route path="folios" element={<FoliosManager />} />
          <Route path="folios/:id" element={<FolioEditor />} />
          <Route path="profile" element={<ProfileEditor />} />
          <Route path="projects" element={<ProjectsManager />} />
          <Route path="skills" element={<SkillsManager />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="account" element={<AccountSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
