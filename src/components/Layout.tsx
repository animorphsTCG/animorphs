
import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <header className="bg-black/50 shadow-md">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-2xl font-bold text-fantasy-accent">
              Animorphs Battle
            </Link>
            
            <div className="hidden md:flex space-x-4">
              <Link to="/" className="hover:text-fantasy-accent transition-colors">
                Home
              </Link>
              
              {user && (
                <>
                  <Link to="/battle" className="hover:text-fantasy-accent transition-colors">
                    Battle
                  </Link>
                  <Link to="/multiplayer" className="hover:text-fantasy-accent transition-colors">
                    Multiplayer
                  </Link>
                  <Link to="/deck-builder" className="hover:text-fantasy-accent transition-colors">
                    Deck Builder
                  </Link>
                  <Link to="/profile" className="hover:text-fantasy-accent transition-colors">
                    Profile
                  </Link>
                </>
              )}
              
              <Link to="/about" className="hover:text-fantasy-accent transition-colors">
                About
              </Link>
            </div>
          </div>
          
          <div>
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm hidden md:inline">
                  {user.email}
                </span>
                <Link 
                  to="/profile" 
                  className="bg-fantasy-accent text-black px-4 py-1 rounded-full hover:bg-fantasy-accent/80 transition-colors"
                >
                  Profile
                </Link>
              </div>
            ) : (
              <div className="space-x-2">
                <Link 
                  to="/login" 
                  className="bg-fantasy-accent/20 border border-fantasy-accent text-fantasy-accent px-4 py-1 rounded-full hover:bg-fantasy-accent/30 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-fantasy-accent text-black px-4 py-1 rounded-full hover:bg-fantasy-accent/80 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>
      
      <main>{children}</main>
      
      <footer className="bg-black/70 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Animorphs Battle. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
