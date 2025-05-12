import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Use our updated Navbar component with visible Privacy Policy links */}
      <Navbar />
      
      <main className="flex-1">{children}</main>
      
      {/* Use our updated Footer component with emphasized Privacy Policy links */}
      <Footer />
    </div>
  );
};

export default Layout;
