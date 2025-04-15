
export interface UserProfile {
  id: string;
  username: string;
  name: string;
  surname: string;
  age: number;
  gender: string | null;
  country: string | null;
  mp: number;
  ai_points: number;
  lbp: number;
  digi: number;
  gold: number;
  music_unlocked: boolean;
  is_admin?: boolean;
  email?: string;
  date_of_birth?: string;
  has_paid?: boolean;
  profile_image_url?: string | null;
}

export interface AnimorphCard {
  id: number;
  card_number: number;
  nft_name: string;
  animorph_type: string;
  size: number;
  power: number;
  health: number;
  attack: number;
  sats: number;
  image_url: string;
  created_at: string;
}

export interface VipCode {
  id: number;
  code: string;
  max_uses: number;
  current_uses: number;
  description?: string;
}

export interface PaymentStatus {
  id: string;
  has_paid: boolean;
  payment_date: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}
