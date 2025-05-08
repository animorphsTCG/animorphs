
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/modules/auth"; // Updated import
import { supabase } from '@/lib/supabase';
import BattleInvites from '@/components/battle/BattleInvites';

const Navbar: React.FC = () => {
  const { user, signOut, userProfile } = useAuth();
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  // Update online status when component mounts
  useEffect(() => {
    if (!user) return;
    
    const updateUserPresence = async () => {
      try {
        const now = new Date().toISOString();
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            last_seen: now,
            status: 'online'
          }, { onConflict: 'user_id' });
      } catch (err) {
        console.error("Error updating presence:", err);
      }
    };
    
    // Update presence on mount
    updateUserPresence();
    
    // Set up interval for regular updates
    const interval = setInterval(updateUserPresence, 30000);
    
    // Set presence to offline on unmount
    return () => {
      clearInterval(interval);
      if (user) {
        supabase
          .from('user_presence')
          .update({ status: 'offline' })
          .eq('user_id', user.id)
          .then(null, err => console.error("Error updating presence:", err));
      }
    };
  }, [user]);
  
  return (
    <nav className="bg-gray-900 bg-opacity-60 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <span className="text-xl font-fantasy text-fantasy-accent">Animorph</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/' ? 'text-white bg-gray-700' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                Home
              </Link>
              <Link to="/card-gallery" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/card-gallery' ? 'text-white bg-gray-700' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                Cards
              </Link>
              <Link to="/battle" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/battle' ? 'text-white bg-gray-700' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                Battle
              </Link>
              {user && (
                <Link to="/profile" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/profile' ? 'text-white bg-gray-700' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                  Profile
                </Link>
              )}
            </div>
          </div>
          
          {/* User actions */}
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-3">
                {userProfile?.has_paid && <BattleInvites />}
                <div className="hidden md:block">
                  <span className="text-sm text-gray-300 mr-2">
                    {userProfile?.username}
                    {userProfile?.has_paid && (
                      <span className="ml-1 text-xs text-green-400">(Paid)</span>
                    )}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" className="bg-fantasy-accent hover:bg-fantasy-accent/80" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="ml-2 -mr-2 flex md:hidden">
              <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
              >
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  {isNavOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isNavOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link 
            to="/" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/' ? 'text-white bg-gray-700' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setIsNavOpen(false)}
          >
            Home
          </Link>
          <Link 
            to="/card-gallery" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/card-gallery' ? 'text-white bg-gray-700' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setIsNavOpen(false)}
          >
            Cards
          </Link>
          <Link 
            to="/battle" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/battle' ? 'text-white bg-gray-700' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setIsNavOpen(false)}
          >
            Battle
          </Link>
          {user && (
            <Link 
              to="/profile" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/profile' ? 'text-white bg-gray-700' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setIsNavOpen(false)}
            >
              Profile
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
