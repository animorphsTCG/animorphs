
import { useState, useEffect, useCallback } from 'react';
import { d1Database } from '@/lib/cloudflare/D1Database';
import { useAuth } from '@/modules/auth';

export function useD1Database() {
  const { token } = useAuth();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize the D1 database client with the auth token
  useEffect(() => {
    if (token?.access_token) {
      try {
        d1Database.setToken(token.access_token);
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize D1 database:', err);
        setError(err as Error);
      }
    } else {
      setIsInitialized(false);
    }
  }, [token]);
  
  // Return the database client along with status
  return {
    db: d1Database,
    isInitialized,
    error
  };
}

// Convenience hooks for specific data types

export function useD1Profile(userId: string | undefined) {
  const { db, isInitialized } = useD1Database();
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchProfile = useCallback(async () => {
    if (!isInitialized || !userId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await db.getProfile(userId);
      setProfile(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, userId, db]);
  
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  const refreshProfile = useCallback(() => {
    return fetchProfile();
  }, [fetchProfile]);
  
  return { profile, isLoading, error, refreshProfile };
}

export function useD1PaymentStatus(userId: string | undefined) {
  const { db, isInitialized } = useD1Database();
  const [paymentStatus, setPaymentStatus] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchPaymentStatus = useCallback(async () => {
    if (!isInitialized || !userId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await db.getPaymentStatus(userId);
      setPaymentStatus(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch payment status:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, userId, db]);
  
  useEffect(() => {
    fetchPaymentStatus();
  }, [fetchPaymentStatus]);
  
  const refreshPaymentStatus = useCallback(() => {
    return fetchPaymentStatus();
  }, [fetchPaymentStatus]);
  
  return { paymentStatus, isLoading, error, refreshPaymentStatus };
}

export function useD1MusicSubscription(userId: string | undefined) {
  const { db, isInitialized } = useD1Database();
  const [subscription, setSubscription] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchSubscription = useCallback(async () => {
    if (!isInitialized || !userId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await db.getMusicSubscription(userId);
      setSubscription(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch music subscription:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, userId, db]);
  
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);
  
  const refreshSubscription = useCallback(() => {
    return fetchSubscription();
  }, [fetchSubscription]);
  
  return { subscription, isLoading, error, refreshSubscription };
}

export function useD1Songs() {
  const { db, isInitialized } = useD1Database();
  const [songs, setSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchSongs = useCallback(async () => {
    if (!isInitialized) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await db.getAllSongs();
      setSongs(result || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch songs:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, db]);
  
  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);
  
  return { songs, isLoading, error, refreshSongs: fetchSongs };
}

export function useD1UserSongs(userId: string | undefined) {
  const { db, isInitialized } = useD1Database();
  const [userSongs, setUserSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchUserSongs = useCallback(async () => {
    if (!isInitialized || !userId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await db.getUserSongs(userId);
      setUserSongs(result || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user songs:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, userId, db]);
  
  useEffect(() => {
    fetchUserSongs();
  }, [fetchUserSongs]);
  
  const addSong = useCallback(async (songId: string) => {
    if (!isInitialized || !userId) {
      return false;
    }
    
    try {
      await db.addSongToUserCollection(userId, songId);
      await fetchUserSongs();
      return true;
    } catch (err) {
      console.error('Failed to add song:', err);
      setError(err as Error);
      return false;
    }
  }, [isInitialized, userId, db, fetchUserSongs]);
  
  const removeSong = useCallback(async (songId: string) => {
    if (!isInitialized || !userId) {
      return false;
    }
    
    try {
      await db.removeSongFromUserCollection(userId, songId);
      await fetchUserSongs();
      return true;
    } catch (err) {
      console.error('Failed to remove song:', err);
      setError(err as Error);
      return false;
    }
  }, [isInitialized, userId, db, fetchUserSongs]);
  
  return { 
    userSongs, 
    isLoading, 
    error, 
    refreshUserSongs: fetchUserSongs,
    addSong,
    removeSong
  };
}
