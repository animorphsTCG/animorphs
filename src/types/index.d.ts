
// Add this to your existing types file or create a new one
// This assumes there's already a types file, if not, we'll need to create one

export interface PaymentStatus {
  has_paid: boolean;
  payment_date: string | null;
  payment_method: string | null;
  transaction_id?: string | null;
  updated_at?: string;
  created_at?: string;
  id?: string;
}

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
}

export interface VipCode {
  id: number;
  code: string;
  max_uses: number;
  current_uses: number;
  created_at: string;
}

// Define any other types that might be needed

