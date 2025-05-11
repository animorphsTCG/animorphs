
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

// Payment status interface
export interface PaymentStatus {
  has_paid: boolean;
  payment_date: string | null;
  payment_method: string | null;
  transaction_id?: string | null;
  updated_at?: string;
  created_at?: string;
  id?: string;
}

// Animorph card interface
export interface AnimorphCard {
  id: number;
  name: string;
  type: string;
  power: number;
  health: number;
  attack: number;
  sats: number;
  size: number;
  image_url: string | null;
  created_at: string;
  nft_name?: string;
  card_number?: number;
  animorph_type?: string;
}

// VIP code interface
export interface VipCode {
  id: number;
  code: string;
  max_uses: number;
  current_uses: number;
  created_at: string;
}
