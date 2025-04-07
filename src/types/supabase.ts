
// This file contains additional Supabase database types for our application
// These complement the auto-generated types from Supabase

export type Tables = {
  profiles: {
    Row: {
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
      favorite_battle_mode: string | null;
      favorite_animorph: string | null;
      online_times_gmt2: string | null;
      created_at: string;
    };
    Insert: {
      id: string;
      username: string;
      name: string;
      surname: string;
      age: number;
      gender?: string | null;
      country?: string | null;
      mp?: number;
      ai_points?: number;
      lbp?: number;
      digi?: number;
      gold?: number;
      music_unlocked?: boolean;
      favorite_battle_mode?: string | null;
      favorite_animorph?: string | null;
      online_times_gmt2?: string | null;
      created_at?: string;
    };
    Update: {
      username?: string;
      name?: string;
      surname?: string;
      age?: number;
      gender?: string | null;
      country?: string | null;
      mp?: number;
      ai_points?: number;
      lbp?: number;
      digi?: number;
      gold?: number;
      music_unlocked?: boolean;
      favorite_battle_mode?: string | null;
      favorite_animorph?: string | null;
      online_times_gmt2?: string | null;
    };
  };
  vip_codes: {
    Row: {
      id: number;
      code: string;
      max_uses: number;
      current_uses: number;
      created_at: string;
    };
    Insert: {
      code: string;
      max_uses: number;
      current_uses?: number;
      created_at?: string;
    };
    Update: {
      code?: string;
      max_uses?: number;
      current_uses?: number;
    };
  };
};
