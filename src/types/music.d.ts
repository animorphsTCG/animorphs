
export interface Song {
  id: string;
  title: string;
  youtube_url: string;
  preview_start_seconds: number;
  preview_duration_seconds: number;
  created_at?: string;
}

export interface SongSelection {
  id: string;
  song_id: string;
  user_id: string;
  created_at?: string;
}

export interface MusicSetting {
  id: string;
  user_id: string;
  volume_level: number;
  music_enabled: boolean;
  created_at?: string;
}

export interface MusicSubscription {
  id: string;
  user_id: string;
  subscription_type: 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  created_at?: string;
}
