
export interface Song {
  id: string;
  title: string;
  youtube_url: string;
  preview_start_seconds: number;
  preview_duration_seconds: number;
}

export interface MusicSettings {
  volume: number;
  isMuted: boolean;
}
