
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Song } from "@/types/music";
import SongInfo from "./music/SongInfo";
import PlaybackControls from "./music/PlaybackControls";
import VolumeControl from "./music/VolumeControl";
import YouTubeEmbed from "./music/YouTubeEmbed";

const MusicPlayer: React.FC = () => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Always attempt to fetch songs, even for anonymous users
    fetchMusicData();
  }, [user]);

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
      console.log("Fetching music data...");
      
      // For anonymous users or when the user object isn't available yet,
      // we'll still show some default songs
      let songIds: string[] = [];
      let settings = { volume: 50, musicEnabled: true };
      
      // Try to fetch user-specific settings if logged in
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

          // Fetch user settings
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
        } catch (err) {
          console.error("Error fetching user-specific music data:", err);
        }
      }

      // If the user has no selections or is not logged in, fetch default songs
      if (songIds.length === 0) {
        console.log("Fetching default songs...");
        // Just get the first few songs from the database as defaults
        const { data: defaultSongs, error: defaultError } = await supabase
          .from('songs')
          .select('id')
          .limit(3);
          
        if (!defaultError && defaultSongs) {
          songIds = defaultSongs.map(song => song.id);
          console.log(`Using ${songIds.length} default songs`);
        }
      }
      
      // Now fetch the actual song data if we have any IDs
      if (songIds.length > 0) {
        console.log("Fetching song details for IDs:", songIds);
        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select('*')
          .in('id', songIds);
        
        if (songsError) {
          console.error("Error fetching songs:", songsError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Couldn't load your music. Please try again later."
          });
        } else if (songsData && songsData.length > 0) {
          console.log(`Retrieved ${songsData.length} song details`);
          setSongs(songsData);
          if (!currentSong) {
            console.log("Setting current song to:", songsData[0]?.title);
            setCurrentSong(songsData[0]);
          }
        }
      } else {
        console.log("No song IDs available");
      }

      // Apply user settings
      setVolume(settings.volume);
      setIsMuted(!settings.musicEnabled);
      setIsPreviewMode(!hasSubscription);
      
    } catch (error) {
      console.error("Unexpected error fetching music data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load music player data."
      });
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
    const currentIndex = songs.findIndex(song => song.id === currentSong?.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
  };

  const prevSong = () => {
    if (songs.length === 0) return;
    const currentIndex = songs.findIndex(song => song.id === currentSong?.id);
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

  if (isLoading) {
    return (
      <div className="bg-black/60 border border-fantasy-primary/30 rounded-md p-3">
        <div className="flex items-center">
          <div className="animate-pulse space-y-2 w-full">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
          <Loader2 className="h-5 w-5 animate-spin ml-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/60 border border-fantasy-primary/30 rounded-md p-3">
      <div className="flex items-center justify-between">
        <SongInfo
          currentSong={currentSong}
          isPreviewMode={isPreviewMode}
          hasSubscription={hasSubscription}
        />
        
        <div className="flex items-center gap-4">
          <PlaybackControls
            isPlaying={isPlaying}
            hasSongs={songs.length > 0}
            onPlayPause={togglePlay}
            onPrevious={prevSong}
            onNext={nextSong}
          />
          
          <VolumeControl
            settings={{ volume, isMuted }}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={toggleMute}
          />
        </div>
      </div>

      <YouTubeEmbed
        currentSong={currentSong}
        isPlaying={isPlaying}
        isMuted={isMuted}
        isPreviewMode={isPreviewMode}
        iframeRef={iframeRef}
      />
    </div>
  );
};

export default MusicPlayer;
