
export interface UserProfile {
  id: string;
  name: string;
  surname: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  country: string;
  email: string;
  has_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface Card {
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
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  stripe_session_id: string | null;
  created_at: string;
  updated_at: string;
}
