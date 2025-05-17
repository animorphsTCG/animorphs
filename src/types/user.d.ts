
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  favorite_animorph?: string;
  favorite_battle_mode?: string;
  online_times_gmt2?: string;
  playing_times?: string;
  profile_image_url?: string;
  created_at?: string;
  updated_at?: string;
  full_name?: string;
  is_admin?: boolean;
  payment_status?: string;
  music_unlocked?: boolean;
  gold_balance?: number;
  mp_balance?: number;
  lbp_balance?: number;
  digi_balance?: number;
  country?: string;
  referrer_code?: string;
  referred_by?: string;
}

export interface User {
  id: string;
  email?: string;
  username?: string;
  profile?: UserProfile;
}
