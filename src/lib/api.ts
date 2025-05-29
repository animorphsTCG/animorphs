import { toast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api';

export interface User {
  id: number;
  eos_id: string;
  email?: string;
  wallet_address?: string;
  has_battle_pass: boolean;
  battle_pass_expires?: string;
  created_at: string;
}

export interface AnimorphCard {
  token_id: number;
  contract_address: string;
  nft_name: string;
  display_name: string;
  card_image_filename: string;
  animorph_type: 'Fire' | 'Water' | 'Ice' | 'Ground' | 'Electric';
  power_rating: number;
  health: number;
  attack: number;
  sats: number;
  size: number;
}

export interface Card {
  token_id: number;
  name: string;
  element: 'Fire' | 'Water' | 'Ice' | 'Ground' | 'Electric';
  power: number;
  health: number;
  attack: number;
  sats: number;
  size: number;
  metadata_uri?: string;
}

export interface UserCard {
  user_id: number;
  token_id: number;
  quantity: number;
  acquired_at: string;
  card?: Card;
}

export interface Match {
  id: number;
  player1: number;
  player2: number;
  result: 'win' | 'lose' | 'draw';
  rounds: any;
  played_at: string;
}

export interface LeaderboardEntry {
  user_id: number;
  lbp_points: number;
  total_wins: number;
  total_matches: number;
  eos_id?: string;
}

export interface Song {
  id: number;
  title: string;
  file_path: string;
  duration: number;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error ${response.status}: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    }
  }

  // Auth endpoints
  async login(eosId: string, walletAddress?: string): Promise<{ user: User; token: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ eos_id: eosId, wallet_address: walletAddress }),
    });
  }

  async getProfile(): Promise<User> {
    return this.request('/auth/profile');
  }

  // Card endpoints
  async getUserCards(userId: number): Promise<UserCard[]> {
    return this.request(`/cards/user/${userId}`);
  }

  async getAllCards(): Promise<AnimorphCard[]> {
    return this.request('/cards');
  }

  // NFT endpoints
  async syncNFTs(walletAddress: string): Promise<{ synced: number; cards: UserCard[] }> {
    return this.request('/nft/sync', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress }),
    });
  }

  // Battle endpoints
  async createMatch(opponentId?: number): Promise<Match> {
    return this.request('/battle/create', {
      method: 'POST',
      body: JSON.stringify({ opponent_id: opponentId }),
    });
  }

  async getMatch(matchId: number): Promise<Match> {
    return this.request(`/battle/match/${matchId}`);
  }

  async makeMove(matchId: number, move: any): Promise<Match> {
    return this.request(`/battle/match/${matchId}/move`, {
      method: 'POST',
      body: JSON.stringify({ move }),
    });
  }

  // Payment endpoints
  async createCheckout(type: 'deck' | 'battle_pass'): Promise<{ checkout_url: string; transaction_id: string }> {
    return this.request('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async getTransactionStatus(transactionId: string): Promise<{ status: string; transaction: any }> {
    return this.request(`/payments/status/${transactionId}`);
  }

  // Music endpoints
  async getSongs(): Promise<Song[]> {
    return this.request('/music/songs');
  }

  async getUserSongs(userId: number): Promise<Song[]> {
    return this.request(`/music/user/${userId}`);
  }

  async selectFreeSongs(songIds: number[]): Promise<{ success: boolean }> {
    return this.request('/music/select-free', {
      method: 'POST',
      body: JSON.stringify({ song_ids: songIds }),
    });
  }

  // Leaderboard endpoints
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.request('/leaderboard');
  }
}

export const apiClient = new ApiClient();

// Updated utility functions for local card images
export const getCardImageUrl = (tokenId: number, filename?: string): string => {
  if (filename) {
    return `/cards/${filename}`;
  }
  // Fallback to token-based naming
  return `/cards/card-${tokenId}.png`;
};

export const getCardImageFallback = (): string => {
  return '/placeholder.svg'; // Using the existing placeholder
};

// Utility function to get card by element color
export const getElementColor = (element: string): string => {
  switch (element) {
    case 'Fire': return 'text-red-500 bg-red-100';
    case 'Water': return 'text-blue-500 bg-blue-100';
    case 'Ice': return 'text-cyan-500 bg-cyan-100';
    case 'Ground': return 'text-amber-500 bg-amber-100';
    case 'Electric': return 'text-yellow-500 bg-yellow-100';
    default: return 'text-gray-500 bg-gray-100';
  }
};
