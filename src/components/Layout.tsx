
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface LayoutProps {
  children?: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />
      
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;
