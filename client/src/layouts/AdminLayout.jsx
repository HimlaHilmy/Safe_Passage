import React from 'react';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import DashboardLayout from './DashboardLayout';

export default function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout />
    </ProtectedRoute>
  );
}
