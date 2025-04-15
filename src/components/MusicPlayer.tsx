
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

    // Using a properly typed query to fetch songs
    const { data: userSongSelections, error: selectionsError } = await supabase
      .from('user_song_selections')
      .select('song_id, songs:songs(*)')
      .eq('user_id', user.id);

    if (selectionsError) {
      console.error("Error fetching song selections:", selectionsError);
      return;
    }

    if (userSongSelections && userSongSelections.length > 0) {
      // Extract the songs data from the nested structure
      const extractedSongs: Song[] = userSongSelections
        .map(selection => selection.songs)
        .filter(song => song !== null);
      
      setSongs(extractedSongs);
      
      if (extractedSongs.length > 0 && !currentSong) {
        setCurrentSong(extractedSongs[0]);
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
    }
  };

  const checkSubscription = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('music_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const hasActiveSubscription = !!data && new Date(data.end_date) > new Date();
    setHasSubscription(hasActiveSubscription);
    setIsPreviewMode(!hasActiveSubscription);
  };
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    updatePlayerState(!isPlaying);
  };
  
  const nextSong = () => {
    const currentIndex = songs.findIndex(song => song.id === currentSong?.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
  };
  
  const prevSong = () => {
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

    const volumeToSave = volumeLevel !== undefined 
      ? volumeLevel / 100 
      : volume / 100;

    await supabase
      .from('user_music_settings')
      .update({
        volume_level: volumeToSave,
        music_enabled: playing && !isMuted
      })
      .eq('user_id', user.id);
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
            className="h-8 w-8 text-gray-300 hover:bg-fantasy-primary/20"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={togglePlay}
            className="h-8 w-8 text-gray-300 hover:bg-fantasy-primary/20"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextSong}
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
