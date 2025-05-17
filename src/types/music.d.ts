
export interface Song {
  id: string;
  title: string;
  youtube_url?: string;  // Make this optional to accommodate R2 songs
  r2_key?: string;
  r2_url?: string;
  preview_start_seconds: number;
  preview_duration_seconds: number;
  created_at?: string;
  artist?: string;
  genre?: string;
  name?: string;  // Add this to make R2Song compatible
}

export interface R2Song {
  id: string;
  name: string;
  size: number;
  lastModified: string;
  url: string;
  contentType: string;
  etag: string;
  title: string;
  artist?: string;
  genre?: string;
  duration?: number;
  metadata?: Record<string, string>;
  preview_start_seconds?: number;
  preview_duration_seconds?: number;
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

export interface MusicSettings {
  volume: number;
  isMuted: boolean;
}
