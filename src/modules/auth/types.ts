
export interface Session {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: User;
}

export interface User {
  id: string;
  email?: string;
  displayName?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  name?: string;
  surname?: string;
  country?: string;
  created_at: string;
  has_paid?: boolean;
  is_admin?: boolean;
  bio?: string;
  favorite_animorph?: string;
  favorite_battle_mode?: string;
  online_times_gmt2?: string;
  playing_times?: string;
  profile_image_url?: string;
  mp?: number;
  ai_points?: number;
  lbp?: number;
  digi?: number;
  gold?: number;
  music_unlocked?: boolean;
  music_subscription?: {
    subscription_type: string;
    end_date: string;
  } | null;
}

export interface WebAuthnCredential {
  id: string;
  publicKey: string;
  algorithm: string;
}
