import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Lock
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/components/ui/use-toast";

interface Song {
  id: string;
  title: string;
  youtube_url: string;
  preview_start_seconds: number;
  preview_duration_seconds: number;
}

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
      // Start preview timer
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
      // First, get the song IDs selected by the user
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
        
        // Now fetch the actual song data for these IDs
        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select('*')
          .in('id', songIds);
        
        if (songsError) {
          console.error("Error fetching songs:", songsError);
          return;
        }
        
        // Ensure we have valid song data with all required properties
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

      // Fetch user's music settings
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

      // Fetch user's music subscription
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
        <div className="flex-1 truncate">
          <p className="font-medium truncate">
            {currentSong?.title || "No song selected"}
          </p>
          <p className="text-xs text-gray-400">
            {isPreviewMode ? "Preview Mode" : "Music Player"}
            {!hasSubscription && (
              <span className="ml-2 text-yellow-400">
                <Lock className="inline-block h-3 w-3 mr-1" />
                Limited Access
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevSong}
            disabled={songs.length === 0}
            className="h-8 w-8 text-gray-300 hover:bg-fantasy-primary/20"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={togglePlay}
            disabled={songs.length === 0}
            className="h-8 w-8 text-gray-300 hover:bg-fantasy-primary/20"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextSong}
            disabled={songs.length === 0}
            className="h-8 w-8 text-gray-300 hover:bg-fantasy-primary/20"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMute}
            className="h-8 w-8 text-gray-300 hover:bg-fantasy-primary/20"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
          <div className="w-20">
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="h-1"
            />
          </div>
        </div>
      </div>

      <div className="hidden">
        <iframe 
          ref={iframeRef}
          src={currentSong ? `https://www.youtube.com/embed/${currentSong.youtube_url.split('?v=')[1]}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&start=${isPreviewMode ? currentSong.preview_start_seconds : 0}` : ''}
          allow="autoplay"
          title="Music Player"
        />
      </div>
    </div>
  );
};

export default MusicPlayer;
