import React from 'react';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import DashboardLayout from './DashboardLayout';

export default function TravelerLayout() {
  return (
    <ProtectedRoute allowedRoles={['traveler', 'admin']}>
      <DashboardLayout />
    </ProtectedRoute>
  );
}
