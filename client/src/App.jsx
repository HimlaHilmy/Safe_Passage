import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import TravelerLayout from './layouts/TravelerLayout';
import ProviderLayout from './layouts/ProviderLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages matching UI Reference
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import ServicesDirectoryPage from './pages/public/ServicesDirectoryPage';
import StoriesPage from './pages/public/StoriesPage';
import ResourcesPage from './pages/public/ResourcesPage';
import ContactPage from './pages/public/ContactPage';
import HowItWorksPage from './pages/public/HowItWorksPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Traveler Pages
import TravelerOverviewPage from './pages/traveler/TravelerOverviewPage';
import ReportEmergencyPage from './pages/traveler/ReportEmergencyPage';
import MyIncidentsPage from './pages/traveler/MyIncidentsPage';
import IncidentTrackingPage from './pages/traveler/IncidentTrackingPage';
import RoadsidePage from './pages/traveler/RoadsidePage';

// Provider Pages
import ProviderOverviewPage from './pages/provider/ProviderOverviewPage';
import ProviderJobsPage from './pages/provider/ProviderJobsPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminIncidentsPage from './pages/admin/AdminIncidentsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Website Routes Matching Reference UI (Screens 1 to 6) */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="services" element={<ServicesDirectoryPage />} />
              <Route path="stories" element={<StoriesPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="how-it-works" element={<HowItWorksPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            {/* Traveler Role Routes */}
            <Route path="/traveler" element={<TravelerLayout />}>
              <Route index element={<TravelerOverviewPage />} />
              <Route path="report" element={<ReportEmergencyPage />} />
              <Route path="services" element={<ServicesDirectoryPage />} />
              <Route path="incidents" element={<MyIncidentsPage />} />
              <Route path="incidents/:id" element={<IncidentTrackingPage />} />
              <Route path="roadside" element={<RoadsidePage />} />
            </Route>

            {/* Provider Role Routes */}
            <Route path="/provider" element={<ProviderLayout />}>
              <Route index element={<ProviderOverviewPage />} />
              <Route path="requests" element={<ProviderOverviewPage />} />
              <Route path="jobs" element={<ProviderJobsPage />} />
              <Route path="navigation" element={<ServicesDirectoryPage />} />
              <Route path="history" element={<ProviderJobsPage />} />
            </Route>

            {/* Admin Role Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="incidents" element={<AdminIncidentsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="providers" element={<AdminUsersPage />} />
              <Route path="services" element={<ServicesDirectoryPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            </Route>

            {/* Catch-all redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
