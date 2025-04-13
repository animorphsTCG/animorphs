
// Export all necessary types for the application

export interface AnimorphCard {
  id: number;
  card_number: number;
  nft_name: string;
  animorph_type: string;
  image_url: string;
  power: number;
  health: number;
  attack: number;
  sats: number;
  size: number;
  created_at: string;
}

export interface VipCode {
  id: number;
  code: string;
  max_uses: number;
  current_uses: number;
  created_at: string;
  description?: string;
}

export interface PaymentStatus {
  has_paid: boolean;
  payment_date: string | null;
  payment_method: string | null;
  transaction_id?: string | null;
  updated_at?: string;
  created_at?: string;
  id?: string;
}

// Re-export types from other files to maintain compatibility
export * from './index.d.ts';
