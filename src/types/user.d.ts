
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  name?: string;
  surname?: string;
  country?: string;
  created_at: string;
  updated_at?: string;
  bio?: string;
  favorite_animorph?: string;
  favorite_battle_mode?: string;
  online_times_gmt2?: string;
  playing_times?: string;
  profile_image_url?: string;
  has_paid: boolean;
  is_admin?: boolean;
  music_unlocked?: boolean;
  mp_points?: number;
  ai_points?: number;
  lbp_points?: number;
  digi_balance?: number;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  bio?: string;
  profile_image_url?: string;
  favorite_animorph?: string;
  mp_points?: number;
  ai_points?: number;
  lbp_points?: number;
}
