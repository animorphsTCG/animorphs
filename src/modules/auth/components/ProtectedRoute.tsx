
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/EOSAuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user || !token) {
    return <Navigate to={`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
