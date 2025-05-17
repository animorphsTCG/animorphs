
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth';
import { d1Worker } from '@/lib/cloudflare/d1Worker';
import { Song, R2Song } from '@/types/music.d';

// Use 'export type' to fix the isolatedModules issue
export type { R2Song };

export const useR2Songs = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [r2Songs, setR2Songs] = useState<R2Song[]>([]);
  const [userSongs, setUserSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user, token } = useAuth();

  const fetchSongs = useCallback(async () => {
    if (!token?.access_token) {
      setSongs([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await d1Worker.query<Song>(
        'SELECT * FROM songs ORDER BY title ASC', 
        {}, 
        token.access_token
      );
      setSongs(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch songs:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch songs'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchR2Songs = useCallback(async () => {
    if (!token?.access_token) {
      setR2Songs([]);
      return;
    }

    try {
      const response = await fetch('/api/r2/songs', {
        headers: {
          Authorization: `Bearer ${token.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch R2 songs');
      }

      const data = await response.json();
      setR2Songs(data.songs || []);
    } catch (err) {
      console.error('Failed to fetch R2 songs:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch R2 songs'));
    }
  }, [token]);

  const getSongStreamUrl = useCallback(async (songName: string): Promise<string> => {
    if (!token?.access_token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`/api/r2/songs/${songName}/stream`, {
        headers: {
          Authorization: `Bearer ${token.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get song stream URL');
      }

      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error('Failed to get song stream URL:', err);
      throw err;
    }
  }, [token]);

  const syncSongsWithDatabase = useCallback(async () => {
    if (!token?.access_token || !user?.id) {
      return { success: false, message: 'Not authenticated' };
    }
    
    try {
      setIsUpdating(true);
      const response = await fetch('/api/r2/songs/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync songs with database');
      }
      
      const result = await response.json();
      await fetchR2Songs();
      await fetchSongs();
      
      return { success: true, message: result.message || 'Successfully synced songs' };
    } catch (err) {
      console.error('Failed to sync songs:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      };
    } finally {
      setIsUpdating(false);
    }
  }, [token, user, fetchR2Songs, fetchSongs]);

  const fetchUserSongs = useCallback(async () => {
    if (!user?.id || !token?.access_token) {
      setUserSongs([]);
      return;
    }

    try {
      setIsLoading(true);
      const result = await d1Worker.query<Song>(
        `SELECT s.*
         FROM songs s
         JOIN user_song_selections uss ON s.id = uss.song_id
         WHERE uss.user_id = ?
         ORDER BY s.title ASC`,
        { params: [user.id] },
        token.access_token
      );
      setUserSongs(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user songs:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user songs'));
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchSongs();
    fetchR2Songs();
  }, [fetchSongs, fetchR2Songs]);

  useEffect(() => {
    fetchUserSongs();
  }, [fetchUserSongs]);

  const addSongToUser = useCallback(async (songId: string) => {
    if (!user?.id || !token?.access_token) return false;
    
    try {
      setIsUpdating(true);
      
      const id = crypto.randomUUID();
      
      await d1Worker.execute(
        'INSERT INTO user_song_selections (id, user_id, song_id) VALUES (?, ?, ?)',
        { params: [id, user.id, songId] },
        token.access_token
      );
      
      await fetchUserSongs();
      return true;
    } catch (err) {
      console.error('Failed to add song to user:', err);
      setError(err instanceof Error ? err : new Error('Failed to add song to user'));
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [user, token, fetchUserSongs]);

  const removeSongFromUser = useCallback(async (songId: string) => {
    if (!user?.id || !token?.access_token) return false;
    
    try {
      setIsUpdating(true);
      
      await d1Worker.execute(
        'DELETE FROM user_song_selections WHERE user_id = ? AND song_id = ?',
        { params: [user.id, songId] },
        token.access_token
      );
      
      await fetchUserSongs();
      return true;
    } catch (err) {
      console.error('Failed to remove song from user:', err);
      setError(err instanceof Error ? err : new Error('Failed to remove song from user'));
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [user, token, fetchUserSongs]);

  return {
    songs,
    r2Songs,
    userSongs,
    isLoading,
    isUpdating,
    error,
    addSongToUser,
    removeSongFromUser,
    refreshSongs: fetchSongs,
    refreshUserSongs: fetchUserSongs,
    getSongStreamUrl,
    syncSongsWithDatabase,
  };
};

export default useR2Songs;
