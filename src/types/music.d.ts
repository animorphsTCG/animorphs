
// Shared music types for both R2 and YouTube songs
export interface Song {
  id: string;
  title: string;
  youtube_url?: string;  // Optional for R2 songs
  r2_key?: string;       // For R2 songs
  r2_url?: string;       // For R2 songs
  preview_start_seconds?: number;
  preview_duration_seconds?: number;
  created_at?: string;
  artist?: string;
  genre?: string;
  name?: string;         // For R2 compatibility
  size?: number;         // For R2 songs
  lastModified?: string; // For R2 songs
  url?: string;          // For R2 songs
  contentType?: string;  // For R2 songs
  etag?: string;         // For R2 songs
  duration?: number;     // For R2 songs
  metadata?: Record<string, string>; // For R2 songs
}

// R2-specific song type
export interface R2Song extends Song {
  name: string;
  size: number;
  lastModified: string;
  url: string;
  contentType: string;
  etag: string;
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
