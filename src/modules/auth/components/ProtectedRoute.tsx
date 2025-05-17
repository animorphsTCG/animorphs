
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/EOSAuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If adminOnly and user is not an admin, redirect to home
  if (adminOnly && !user.is_admin) {
    return <Navigate to="/" replace />;
  }
  
  // User is authenticated (and is admin if adminOnly), render the children
  return <>{children}</>;
};

export default ProtectedRoute;
