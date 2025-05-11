
// User profile interface
export interface UserProfile {
  id: string;
  username: string;
  name?: string;
  surname?: string;
  email?: string;
  country?: string;
  created_at?: string;
  has_paid?: boolean;
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
  bio?: string | null;
  favorite_animorph?: string | null;
  favorite_battle_mode?: string | null;
  online_times_gmt2?: string | null;
  playing_times?: string | null;
  profile_image_url?: string | null;
}
