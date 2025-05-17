
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/EOSAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, userProfile, isLoading } = useAuth();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If adminOnly and user is not an admin, redirect to home
  if (adminOnly && (!userProfile || !userProfile.is_admin)) {
    return <Navigate to="/" replace />;
  }
  
  // User is authenticated (and is admin if adminOnly), render the children
  return <>{children}</>;
};

export default ProtectedRoute;
