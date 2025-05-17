import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Song, R2Song } from '@/types/music.d';
import { useR2Songs } from '@/hooks/useR2Songs';

export const useMusicPlayer = () => {
  const { user, userProfile } = useAuth();
  const { r2Songs, getSongStreamUrl } = useR2Songs();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | R2Song | null>(null);
  const [songs, setSongs] = useState<(Song | R2Song)[]>([]);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ytApiReady, setYtApiReady] = useState(false);
  const playerRef = useRef<any>(null);
  const previewTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Only load YouTube API if we're using YouTube songs
    const shouldLoadYouTubeApi = !r2Songs || r2Songs.length === 0;
    if (shouldLoadYouTubeApi) {
      loadYouTubeApi();
    }
    fetchMusicData();
  }, [user, userProfile, r2Songs]);

  // Listen for song end events
  useEffect(() => {
    const handleSongEnded = () => {
      console.log("Song ended event received");
      nextSong();
    };
    
    document.addEventListener('r2song:ended', handleSongEnded);
    
    return () => {
      document.removeEventListener('r2song:ended', handleSongEnded);
    };
  }, []);

  // Check if user has a music subscription
  const checkMusicSubscription = async (userId: string) => {
    try {
      console.log("Checking music subscription for user:", userId);
      
      // First check if music_unlocked is true in the profile
      if (userProfile?.music_unlocked) {
        console.log("User has music_unlocked in profile");
        return true;
      }
      
      // Then check for an active subscription in the music_subscriptions table
      const { data, error } = await supabase
        .from('music_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error("Error checking music subscription:", error);
        }
        return false;
      }
      
      if (data) {
        const endDate = new Date(data.end_date);
        const now = new Date();
        
        if (endDate > now) {
          console.log("User has active music subscription until:", endDate.toISOString());
          return true;
        } else {
          console.log("User has expired music subscription:", endDate.toISOString());
        }
      }
      
      return false;
    } catch (err) {
      console.error("Error in checkMusicSubscription:", err);
      return false;
    }
  };

  const loadYouTubeApi = () => {
    if (window.YT) {
      setYtApiReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    
    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API ready');
      setYtApiReady(true);
    };
  };

  useEffect(() => {
    if (isPreviewMode && isPlaying && currentSong) {
      previewTimerRef.current = setTimeout(() => {
        setIsPlaying(false);
        toast({
          title: "Preview ended",
          description: "Subscribe to listen to full songs!",
        });
      }, (currentSong?.preview_duration_seconds || 30) * 1000);
    }

    return () => {
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }
    };
  }, [isPreviewMode, isPlaying, currentSong]);

  const fetchMusicData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching music data...");
      
      let combinedSongs: (Song | R2Song)[] = [];
      let settings = { volume: 50, musicEnabled: true };
      
      // Prioritize R2 songs if available
      if (r2Songs && r2Songs.length > 0) {
        console.log(`Using ${r2Songs.length} R2 songs`);
        combinedSongs = [...r2Songs];
      } else {
        // Fall back to YouTube songs
        let songIds: string[] = [];
        
        if (user) {
          try {
            console.log("Fetching user song selections...");
            const { data: userSongSelections, error: selectionsError } = await supabase
              .from('user_song_selections')
              .select('song_id')
              .eq('user_id', user.id);
  
            if (selectionsError) {
              console.error("Error fetching song selections:", selectionsError);
            } else {
              songIds = userSongSelections?.map(selection => selection.song_id) || [];
              console.log(`Got ${songIds.length} song selections`);
            }
  
            const { data: userSettings, error: settingsError } = await supabase
              .from('user_music_settings')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
  
            if (!settingsError && userSettings) {
              settings = {
                volume: userSettings.volume_level * 100,
                musicEnabled: userSettings.music_enabled
              };
            }
  
            // Check if user has music subscription
            const hasMusicSub = await checkMusicSubscription(user.id);
            setHasSubscription(hasMusicSub);
            setIsPreviewMode(!hasMusicSub);
            console.log("Music subscription status:", hasMusicSub, "isPreviewMode:", !hasMusicSub);
            
          } catch (err) {
            console.error("Error fetching user-specific music data:", err);
            setError("Failed to fetch your music settings");
          }
        }
  
        if (songIds.length === 0) {
          console.log("Fetching default songs...");
          const { data: defaultSongs, error: defaultError } = await supabase
            .from('songs')
            .select('id')
            .limit(3);
            
          if (defaultError) {
            console.error("Error fetching default songs:", defaultError);
            setError("Failed to load default songs");
          } else if (defaultSongs) {
            songIds = defaultSongs.map(song => song.id);
            console.log(`Using ${songIds.length} default songs`);
          }
        }
        
        if (songIds.length > 0) {
          console.log("Fetching song details for IDs:", songIds);
          const { data: songsData, error: songsError } = await supabase
            .from('songs')
            .select('*')
            .in('id', songIds);
          
          if (songsError) {
            console.error("Error fetching songs:", songsError);
            setError("Couldn't load your music. Please try again later.");
          } else if (songsData && songsData.length > 0) {
            console.log(`Retrieved ${songsData.length} song details`);
            combinedSongs = [...songsData];
          }
        }
      }
      
      setSongs(combinedSongs);
      if (combinedSongs.length > 0 && !currentSong) {
        console.log("Setting current song to:", 'title' in combinedSongs[0] ? combinedSongs[0].title : combinedSongs[0].name);
        setCurrentSong(combinedSongs[0]);
      }

      setVolume(settings.volume);
      setIsMuted(!settings.musicEnabled);
      
    } catch (error) {
      console.error("Unexpected error fetching music data:", error);
      setError("Failed to load music player data.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    updatePlayerState(!isPlaying);
  };

  const nextSong = () => {
    if (songs.length === 0) return;
    
    const currentIndex = songs.findIndex(song => {
      if ('id' in song && currentSong && 'id' in currentSong) {
        return song.id === currentSong.id;
      } else if ('name' in song && currentSong && 'name' in currentSong) {
        return song.name === currentSong.name;
      }
      return false;
    });
    
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
  };

  const prevSong = () => {
    if (songs.length === 0) return;
    
    const currentIndex = songs.findIndex(song => {
      if ('id' in song && currentSong && 'id' in currentSong) {
        return song.id === currentSong.id;
      } else if ('name' in song && currentSong && 'name' in currentSong) {
        return song.name === currentSong.name;
      }
      return false;
    });
    
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    updatePlayerState(isPlaying, isMuted ? volume : 0);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
    updatePlayerState(isPlaying, newVolume);
  };

  const updatePlayerState = async (playing: boolean, volumeLevel?: number) => {
    if (!user) return;

    try {
      const volumeToSave = volumeLevel !== undefined 
        ? volumeLevel / 100 
        : volume / 100;

      await supabase
        .from('user_music_settings')
        .upsert({ 
          user_id: user.id,
          volume_level: volumeToSave,
          music_enabled: playing && !isMuted
        });
    } catch (error) {
      console.error("Error updating player state:", error);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchMusicData();
  };

  const extractVideoId = (url: string): string => {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v') || '';
      }
      if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1);
      }
    } catch (e) {
      console.error("Invalid URL format:", url);
      return '';
    }
    
    return '';
  };

  return {
    isPlaying,
    currentSong,
    songs,
    volume,
    isMuted,
    hasSubscription,
    isPreviewMode,
    isLoading,
    error,
    ytApiReady,
    playerRef,
    togglePlay,
    nextSong,
    prevSong,
    toggleMute,
    handleVolumeChange,
    handleRetry,
    extractVideoId,
    getSongStreamUrl,
  };
};

export default useMusicPlayer;
