
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth';
import { r2Client, R2BucketObject } from '@/lib/cloudflare/r2Client';
import { toast } from '@/hooks/use-toast';
import { d1 } from '@/lib/d1Database';

export interface R2Song extends R2BucketObject {
  id: string;
  title: string;
  artist?: string;
  genre?: string;
  duration?: number;
}

export function useR2Songs() {
  const { token, user } = useAuth();
  const [songs, setSongs] = useState<R2Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasConfigured, setHasConfigured] = useState(false);

  // Configure the R2 client with the authorization token
  useEffect(() => {
    if (token?.access_token && !hasConfigured) {
      // In a real implementation, the token would be from Cloudflare
      // For now, we're using the auth token we already have
      r2Client.accessToken = token.access_token;
      setHasConfigured(true);
    }
  }, [token, hasConfigured]);

  // Helper function to parse song info from filename
  const parseSongInfo = (filename: string): Partial<R2Song> => {
    try {
      // Extract metadata from filename
      // Expected format: Artist - Title.mp3
      // or just Title.mp3
      let artist = 'Unknown';
      let title = filename;
      
      // Strip extension
      title = title.replace(/\.(mp3|wav|ogg|m4a)$/, '');
      
      // Check for artist separator
      if (title.includes(' - ')) {
        const parts = title.split(' - ', 2);
        artist = parts[0].trim();
        title = parts[1].trim();
      }
      
      // Clean up title (remove numbers from beginning if present)
      title = title.replace(/^\d+[\.\s-]+/, '').trim();
      
      return { title, artist };
    } catch (e) {
      console.error('Error parsing song info:', e);
      return { title: filename };
    }
  };

  // Fetch song entries from the R2 bucket
  const fetchR2Songs = useCallback(async () => {
    if (!hasConfigured) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get songs from R2 bucket
      const r2Objects = await r2Client.listObjects('');
      
      // Process song objects
      const processedSongs = r2Objects
        .filter(obj => {
          // Only include audio files with common extensions
          const extensions = ['.mp3', '.wav', '.ogg', '.m4a'];
          return extensions.some(ext => obj.name.toLowerCase().endsWith(ext));
        })
        .map(obj => {
          // Generate a consistent ID for each song
          const id = `r2-${btoa(obj.name).replace(/[\/\+\=]/g, '')}`;
          
          // Extract song title and artist from filename
          const songInfo = parseSongInfo(obj.name);
          
          return {
            ...obj,
            id,
            title: songInfo.title || 'Unknown Song',
            artist: songInfo.artist || 'Unknown Artist'
          };
        });
      
      setSongs(processedSongs);
    } catch (err) {
      console.error('Error fetching R2 songs:', err);
      setError(err as Error);
      toast({
        title: "Failed to load songs",
        description: "Could not retrieve songs from storage",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [hasConfigured]);

  useEffect(() => {
    fetchR2Songs();
  }, [fetchR2Songs]);

  // Sync songs with D1 database for persistence
  const syncSongsWithDatabase = useCallback(async () => {
    if (!user?.id || !songs.length) return;
    
    try {
      for (const song of songs) {
        // Check if song exists in the database
        const existingSong = await d1.from('songs')
          .where('r2_key', '=', song.name)
          .first();
          
        if (!existingSong) {
          // Add new song to database
          await d1.from('songs').insert({
            title: song.title,
            r2_key: song.name,
            r2_url: song.url,
            artist: song.artist || 'Unknown Artist',
            youtube_url: '', // Empty for R2 songs
            preview_start_seconds: 0,
            preview_duration_seconds: 30
          });
        }
      }
    } catch (err) {
      console.error('Error syncing songs with database:', err);
    }
  }, [songs, user?.id]);

  // Helper function to get a presigned URL for a song
  const getSongStreamUrl = useCallback(async (songName: string): Promise<string> => {
    if (!hasConfigured) return '';
    
    try {
      // In a real implementation, we would get a presigned URL
      // For now, we're returning the direct R2 URL
      return r2Client.getObjectUrl(songName);
    } catch (err) {
      console.error('Error getting song stream URL:', err);
      return '';
    }
  }, [hasConfigured]);

  return {
    songs,
    isLoading,
    error,
    refreshSongs: fetchR2Songs,
    getSongStreamUrl,
    syncSongsWithDatabase
  };
}
