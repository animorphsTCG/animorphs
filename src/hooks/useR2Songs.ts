
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth';
import { d1Worker } from '@/lib/cloudflare/d1Worker';

interface Song {
  id: string;
  title: string;
  youtube_url: string;
  preview_start_seconds?: number;
  preview_duration_seconds?: number;
  created_at?: string;
}

export const useR2Songs = () => {
  const [songs, setSongs] = useState<Song[]>([]);
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
  }, [fetchSongs]);

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
    userSongs,
    isLoading,
    isUpdating,
    error,
    addSongToUser,
    removeSongFromUser,
    refreshSongs: fetchSongs,
    refreshUserSongs: fetchUserSongs
  };
};

export default useR2Songs;
