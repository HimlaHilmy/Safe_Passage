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

// Provider Pages (Member 4 - Himla)
import ProviderDashboardPage from './pages/provider/ProviderDashboardPage';
import ProviderRequestsPage from './pages/provider/ProviderRequestsPage';
import ProviderRequestDetailsPage from './pages/provider/ProviderRequestDetailsPage';
import ProviderJobsPage from './pages/provider/ProviderJobsPage';
import ProviderMapPage from './pages/provider/ProviderMapPage';
import ProviderHistoryPage from './pages/provider/ProviderHistoryPage';
import ProviderProfilePage from './pages/provider/ProviderProfilePage';

// Admin Pages (Member 5 - Hirunika)
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminIncidentsPage from './pages/admin/AdminIncidentsPage';
import AdminIncidentDetailPage from './pages/admin/AdminIncidentDetailPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProvidersPage from './pages/admin/AdminProvidersPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
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

            {/* Provider Role Routes (Member 4 - Himla) */}
            <Route path="/provider" element={<ProviderLayout />}>
              <Route index element={<Navigate to="/provider/dashboard" replace />} />
              <Route path="dashboard" element={<ProviderDashboardPage />} />
              <Route path="requests" element={<ProviderRequestsPage />} />
              <Route path="requests/:id" element={<ProviderRequestDetailsPage />} />
              <Route path="jobs" element={<ProviderJobsPage />} />
              <Route path="map" element={<ProviderMapPage />} />
              <Route path="navigation" element={<Navigate to="/provider/map" replace />} />
              <Route path="history" element={<ProviderHistoryPage />} />
              <Route path="profile" element={<ProviderProfilePage />} />
            </Route>

            {/* Admin Role Routes (Member 5 - Hirunika) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="incidents" element={<AdminIncidentsPage />} />
              <Route path="incidents/:id" element={<AdminIncidentDetailPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="providers" element={<AdminProvidersPage />} />
              <Route path="services" element={<AdminServicesPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
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
