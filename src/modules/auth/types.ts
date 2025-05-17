
export interface UserProfile {
  id: string;
  user_id?: string;
  username: string;
  email?: string;
  name?: string;
  surname?: string;
  country?: string;
  created_at: string;
  has_paid?: boolean;
  is_admin?: boolean;
  music_unlocked?: boolean;
  displayName: string;
  profile_image_url?: string;
  favorite_animorph?: string;
  favorite_battle_mode?: string;
  online_times_gmt2?: string;
  playing_times?: string;
  mp_points?: number;
  ai_points?: number;
  lbp_points?: number;
  digi_balance?: number;
  bio?: string;
  // Compatibility fields
  mp?: number;
  lbp?: number;
  digi?: number;
}

export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token?: string;
  user?: any;
}

export interface AuthToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export interface AuthContextProps {
  session: Session | null;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  token: AuthToken | null;
  userProfile: UserProfile | null;
  handleEpicAuthCallback: (url: URL) => Promise<boolean>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // Alias for compatibility
  authenticateAdmin: (totpCode: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
  // Add stub methods for backward compatibility
  resetPassword: (email: string) => Promise<any>;
  updatePassword: (password: string) => Promise<any>;
}
