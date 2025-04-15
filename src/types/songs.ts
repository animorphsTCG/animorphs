
import { Song } from './music';

export interface SongForm {
  title: string;
  videoId: string;
  previewStart: number;
  previewDuration: number;
}

export interface SongTableProps {
  songs: Song[];
  onEdit: (song: Song) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}
