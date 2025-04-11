
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  surname: string;
  age: number;
  gender?: string;
  country?: string;
  mp: number;
  ai_points: number;
  lbp: number;
  digi: number;
  gold: number;
  music_unlocked: boolean;
  favorite_battle_mode?: string;
  favorite_animorph?: string;
  online_times_gmt2?: string;
  created_at: string;
}

export interface Card {
  id: number;
  card_number: number;
  image_url: string;
  nft_name?: string;
  animorph_type?: string;
  power?: number;
  health?: number;
  attack?: number;
  sats?: number;
  size?: number;
}

export interface AnimorphCard {
  id: number;
  card_number: number;
  image_url: string;
  nft_name: string;
  animorph_type: string;
  power: number;
  health: number;
  attack: number;
  sats: number;
  size: number;
  created_at?: string;
}

export interface DisplayCard {
  id: number;
  card_number: number;
  image_url: string;
}

export interface VipCode {
  id: number;
  code: string;
  max_uses: number;
  current_uses: number;
  description?: string;
  created_at?: string;
}

export interface Song {
  id: number;
  title: string;
  youtube_url: string;
}

export interface Game {
  id: number;
  game_type: string;
  status: string;
  players: any;
  game_state: any;
  round: number;
  created_at: string;
}
