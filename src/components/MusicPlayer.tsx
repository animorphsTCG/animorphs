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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (user) {
      fetchMusicData();
      checkSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (isPreviewMode && isPlaying) {
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
    if (!user) return;

    try {
      const { data: userSongSelections, error: selectionsError } = await supabase
        .from('user_song_selections')
        .select('song_id')
        .eq('user_id', user.id);

      if (selectionsError) {
        console.error("Error fetching song selections:", selectionsError);
        return;
      }

      if (userSongSelections && userSongSelections.length > 0) {
        const songIds = userSongSelections.map(selection => selection.song_id);
        
        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select('*')
          .in('id', songIds);
        
        if (songsError) {
          console.error("Error fetching songs:", songsError);
          return;
        }
        
        const validSongs: Song[] = songsData?.filter((song): song is Song => 
          song && 
          typeof song.id === 'string' && 
          typeof song.title === 'string' && 
          typeof song.youtube_url === 'string' &&
          typeof song.preview_start_seconds === 'number' &&
          typeof song.preview_duration_seconds === 'number'
        ) || [];
        
        setSongs(validSongs);
        
        if (validSongs.length > 0 && !currentSong) {
          setCurrentSong(validSongs[0]);
        }
      }

      const { data: settings, error: settingsError } = await supabase
        .from('user_music_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settings) {
        setVolume(settings.volume_level * 100);
        setIsMuted(!settings.music_enabled);
      } else if (settingsError && settingsError.code !== 'PGRST116') {
        console.error("Error fetching music settings:", settingsError);
      }

      const { data, error } = await supabase
        .from('music_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const hasActiveSubscription = !!data && new Date(data.end_date) > new Date();
      setHasSubscription(hasActiveSubscription);
      setIsPreviewMode(!hasActiveSubscription);
    } catch (error) {
      console.error("Unexpected error fetching music data:", error);
    }
  };

  const checkSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('music_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const hasActiveSubscription = !!data && new Date(data.end_date) > new Date();
      setHasSubscription(hasActiveSubscription);
      setIsPreviewMode(!hasActiveSubscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
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
