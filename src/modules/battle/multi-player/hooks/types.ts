
export interface BattleLobbyConfig {
  name: string;
  battleType: '1v1' | '2v2' | '3v3' | 'free-for-all';
  maxPlayers: number;
  isPublic: boolean;
}

export interface Lobby {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  battle_type: string;
  status: 'waiting' | 'in_progress' | 'completed';
  max_players: number;
  is_public: boolean;
}

export interface Participant {
  id: string;
  lobby_id: string;
  user_id: string;
  player_number: number;
  username?: string;
  profile_image_url?: string;
}

export interface BattleSession {
  id: string;
  lobby_id: string;
  battle_type: string;
  created_by: string;
  status: 'waiting' | 'in_progress' | 'completed';
  winner_id?: string;
  current_round: number;
  current_player_index: number;
  created_at: string;
  updated_at?: string;
  ended_at?: string;
}
