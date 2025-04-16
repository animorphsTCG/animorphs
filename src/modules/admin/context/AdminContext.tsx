
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';

interface AdminContextState {
  isAdminMode: boolean;
  setAdminMode: (value: boolean) => void;
}

const AdminContext = createContext<AdminContextState>({} as AdminContextState);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminMode, setAdminMode] = useState(false);
  const { user } = useAuth();

  // Reset admin mode when user changes
  React.useEffect(() => {
    if (!user) {
      setAdminMode(false);
    }
  }, [user]);

  return (
    <AdminContext.Provider
      value={{
        isAdminMode,
        setAdminMode
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
