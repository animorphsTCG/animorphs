
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, UserProfile, AuthToken, AuthContextProps } from '../types';
import { toast } from '@/components/ui/use-toast';
import { d1Database } from '@/lib/d1Database';
import { 
  getEpicGamesOAuthURL, 
  handleAuthCallback, 
  getUserProfile, 
  signOut as eosSignOut 
} from '@/lib/eos/eosAuth';

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface EOSAuthProviderProps {
  children: React.ReactNode;
}

const mapUserResponse = (data: any): UserProfile => {
  return {
    id: data.id,
    username: data.username || data.displayName,
    email: data.email,
    name: data.name,
    surname: data.surname,
    country: data.country,
    created_at: data.created_at || new Date().toISOString(),
    has_paid: Boolean(data.has_paid),
    is_admin: Boolean(data.is_admin),
    music_unlocked: Boolean(data.music_unlocked || false),
    // Add any other required fields with reasonable defaults
    displayName: data.displayName || data.username,
    profile_image_url: data.profile_image_url || '',
    favorite_animorph: data.favorite_animorph || '',
    favorite_battle_mode: data.favorite_battle_mode || '',
    online_times_gmt2: data.online_times_gmt2 || '',
    playing_times: data.playing_times || '',
    mp_points: data.mp_points || 0,
    ai_points: data.ai_points || 0,
    lbp_points: data.lbp_points || 0,
    digi_balance: data.digi_balance || 0
  };
};

export const EOSAuthProvider: React.FC<EOSAuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<AuthToken | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedSession = localStorage.getItem('eos_session');
    if (storedSession) {
      try {
        const parsedSession: Session = JSON.parse(storedSession);
        setSession(parsedSession);
        
        if (parsedSession.user) {
          const mappedUser = mapUserResponse(parsedSession.user);
          setUser(mappedUser);
        }
        
        setToken({
          access_token: parsedSession.access_token,
          refresh_token: parsedSession.refresh_token,
          expires_at: parsedSession.expires_at
        });
      } catch (err) {
        console.error("Error parsing stored session", err);
      }
    }
    setLoading(false);
  }, []);

  const updateSession = (newSession: Session | null) => {
    if (newSession) {
      localStorage.setItem('eos_session', JSON.stringify(newSession));
      
      if (newSession.access_token) {
        setToken({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
          expires_at: newSession.expires_at
        });
      }
    } else {
      localStorage.removeItem('eos_session');
      setToken(null);
    }
    setSession(newSession);
  };

  // Handle EOS Auth Callback
  const handleEpicAuthCallback = async (url: URL) => {
    setLoading(true);
    setError(null);

    try {
      // Exchange code for token
      const authResponse = await handleAuthCallback(url);
      
      // Get user profile with the token
      const userProfile = await getUserProfile(authResponse.access_token);
      
      const newSession: Session = {
        access_token: authResponse.access_token,
        token_type: authResponse.token_type,
        refresh_token: authResponse.refresh_token,
        expires_in: authResponse.expires_in,
        expires_at: authResponse.expires_at || Date.now() + (authResponse.expires_in * 1000),
        user: {
          ...userProfile,
          id: userProfile.id
        }
      };

      updateSession(newSession);
      
      const mappedUser = mapUserResponse({
        ...userProfile,
        id: userProfile.id
      });
      setUser(mappedUser);
      
      navigate('/');
      toast({
        title: "Login Successful",
        description: `Welcome, ${userProfile.displayName}!`,
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Epic Games Login Failed",
        description: err.message,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setError(null);

    try {
      await eosSignOut();

      updateSession(null);
      setUser(null);
      navigate('/login');
      toast({
        title: "Logout Successful",
        description: "You have been successfully logged out.",
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const authenticateAdmin = async (totpCode: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token?.access_token}`,
        },
        body: JSON.stringify({ totp: totpCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Admin authentication failed');
      }

      const data = await response.json();
      const adminSession: Session = {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        expires_at: Date.now() + (data.expires_in * 1000),
        user: data.user,
      };

      updateSession(adminSession);
      
      if (data.user) {
        const mappedUser = mapUserResponse(data.user);
        setUser(mappedUser);
      }
      
      navigate('/admin');
      toast({
        title: "Admin Authentication Successful",
        description: "You have been successfully authenticated as an administrator.",
      });
      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Admin Authentication Failed",
        description: err.message,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user?.id || !token?.access_token) return;
    
    try {
      setLoading(true);
      // Fetch updated profile from D1
      const updatedProfile = await d1Database.getProfile(user.id);
      if (updatedProfile) {
        const mappedUser = mapUserResponse({...user, ...updatedProfile});
        setUser(mappedUser);
      }
    } catch (err) {
      console.error("Failed to refresh profile", err);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextProps = {
    session,
    user,
    loading,
    error,
    token,
    userProfile: user,
    handleEpicAuthCallback,
    logout: handleLogout,
    signOut: handleLogout, // Alias for compatibility
    authenticateAdmin,
    refreshProfile,
    isLoading: loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export for backwards compatibility
export const AuthProvider = EOSAuthProvider;
