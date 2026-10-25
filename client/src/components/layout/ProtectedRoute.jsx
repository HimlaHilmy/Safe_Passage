import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullPage text="Authenticating user session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, verify access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to user's appropriate default dashboard rather than unauthorized lock
    const redirectPath = user.role === 'admin' ? '/admin' : user.role === 'provider' ? '/provider' : '/traveler';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
