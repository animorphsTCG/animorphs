import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '../types';
import { UserProfile } from '../types';
import { toast } from '@/components/ui/use-toast';
import { d1Database } from '@/lib/d1Database';

interface AuthContextProps {
  session: Session | null;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  authenticateAdmin: (totpCode: string) => Promise<boolean>;
}

interface Credentials {
  email: string;
  password?: string;
  username?: string;
  totp?: string;
}

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
    username: data.username,
    email: data.email,
    name: data.name,
    surname: data.surname,
    country: data.country,
    created_at: data.created_at,
    has_paid: Boolean(data.has_paid),
    is_admin: Boolean(data.is_admin),
    music_unlocked: Boolean(data.music_unlocked || false),
    // Add any other required fields with reasonable defaults
    age: data.age || 0,
    gender: data.gender || '',
    mp: data.mp || 0,
    ai_points: data.ai_points || 0,
    lbp: data.lbp || 0,
    digi: data.digi || 0,
    gold: data.gold || 0,
    favorite_animorph: data.favorite_animorph || '',
    favorite_battle_mode: data.favorite_battle_mode || '',
    online_times_gmt2: data.online_times_gmt2 || '',
    playing_times: data.playing_times || '',
    profile_image_url: data.profile_image_url || ''
  };
};

export const EOSAuthProvider: React.FC<EOSAuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
      const parsedSession: Session = JSON.parse(storedSession);
      setSession(parsedSession);

      if (parsedSession.user) {
        setUser(mapUserResponse(parsedSession.user));
      }
    }
  }, []);

  const updateSession = (newSession: Session | null) => {
    if (newSession) {
      localStorage.setItem('session', JSON.stringify(newSession));
    } else {
      localStorage.removeItem('session');
    }
    setSession(newSession);
  };

  // Fix the login flow to properly set token
  const handleLogin = async (credentials: Credentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      const newSession: Session = {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        expires_at: Date.now() + (data.expires_in * 1000),
        user: data.user,
      };

      updateSession(newSession);
      setUser(mapUserResponse(data.user));
      navigate('/');
      toast({
        title: "Login Successful",
        description: `Welcome, ${data.user.username}!`,
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setError(null);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

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
      setUser(mapUserResponse(data.user));
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

  const value: AuthContextProps = {
    session,
    user,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    authenticateAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
