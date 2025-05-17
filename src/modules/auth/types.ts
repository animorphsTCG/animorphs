
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  name?: string;
  surname?: string;
  country?: string;
  created_at?: string;
  updated_at?: string;
  is_admin: boolean;
  music_unlocked: boolean;
  profile_image_url?: string;
}

export interface PaymentInfo {
  has_paid: boolean;
  payment_date?: string;
  payment_method?: string;
  transaction_id?: string;
  created_at?: string;
  updated_at?: string;
  id?: string;
}

export interface MusicSubscription {
  id: string;
  user_id: string;
  subscription_type: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  profile?: UserProfile;
  paymentInfo?: PaymentInfo;
  musicSubscription?: MusicSubscription;
}

export interface AuthToken {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

export interface AuthState {
  user: User | null;
  token: AuthToken | null;
  loading: boolean;
  error: Error | null;
}
