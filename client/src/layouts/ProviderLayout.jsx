import React from 'react';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import DashboardLayout from './DashboardLayout';

export default function ProviderLayout() {
  return (
    <ProtectedRoute allowedRoles={['provider', 'admin']}>
      <DashboardLayout />
    </ProtectedRoute>
  );
}
