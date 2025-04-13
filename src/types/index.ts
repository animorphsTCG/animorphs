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

// Define UserProfile type needed by other components
export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
  role?: string;
  country?: string;
  bio?: string;
  // Add the missing properties from previous updates
  name?: string;
  surname?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  has_paid?: boolean;
  // Add the age property
  age?: number;  // Make it optional with '?'
}

// Import types from index.d.ts file (without using "export *")
import type * as Types from './index.d.ts';
// Re-export specific types from index.d.ts
export type { Types as TypeDefinitions };
