
import { useState, useEffect } from 'react';
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

export const useD1Songs = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchSongs = async () => {
      if (!token?.access_token) return;

      try {
        setIsLoading(true);
        const results = await d1Worker.query(
          'SELECT * FROM songs ORDER BY title',
          {},
          token.access_token
        );
        
        setSongs(results as Song[]);
      } catch (err) {
        console.error('Error fetching songs:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, [token]);

  return { songs, isLoading, error };
};

export default useD1Songs;
