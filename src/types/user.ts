
// Extended UserProfile interface to include all needed fields
export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  email?: string;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Profile fields
  bio?: string;
  favorite_animorph?: string;
  favorite_battle_mode?: string;
  online_times_gmt2?: string;
  playing_times?: string;
  profile_image_url?: string;
  
  // Stats and game-related fields
  mp_points?: number;
  ai_points?: number;
  lbp_points?: number;
  digi_balance?: number;
  gold_balance?: number;
  paid_status?: boolean;
  subscription_status?: string;
  subscription_expires_at?: string;
}

export interface AdminProfile extends UserProfile {
  is_admin: boolean;
  admin_token?: string;
}

export interface UserPaymentInfo {
  user_id: string;
  payment_id: string;
  payment_method: string;
  payment_status: string;
  payment_amount: number;
  payment_currency: string;
  payment_date: string;
  payment_reference?: string;
}

export interface UserSubscription {
  user_id: string;
  subscription_id: string;
  subscription_type: string;
  subscription_status: string;
  subscription_start_date: string;
  subscription_end_date: string;
  auto_renew: boolean;
}
