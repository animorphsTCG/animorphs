
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";

interface Song {
  id: string;
  title: string;
  youtube_url: string;
}

const MusicPlayer: React.FC = () => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Fetch user's music settings and available songs
  useEffect(() => {
    const fetchMusicData = async () => {
      if (!user) return;

      // Fetch available songs
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select('*');

      // Fetch user's music settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_music_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (songData) setSongs(songData);
      
      // Set initial volume and playback state
      if (settingsData) {
        setVolume(settingsData.volume_level * 100);
        setIsMuted(!settingsData.music_enabled);
      }
    };

    fetchMusicData();
  }, [user]);
  
  // Play/pause toggle
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    updatePlayerState(!isPlaying);
  };
  
  // Skip to next song
  const nextSong = () => {
    const currentIndex = songs.findIndex(song => song.id === currentSong?.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
  };
  
  // Go to previous song
  const prevSong = () => {
    const currentIndex = songs.findIndex(song => song.id === currentSong?.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
  };
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    updatePlayerState(isPlaying, isMuted ? volume : 0);
  };
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
    updatePlayerState(isPlaying, newVolume);
  };

  // Update player state and save to database
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
          <p className="text-xs text-gray-400">Music Player</p>
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
            {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
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

      {/* Hidden YouTube Player */}
      <div className="hidden">
        <iframe 
          ref={iframeRef}
          src={currentSong ? `https://www.youtube.com/embed/${currentSong.youtube_url.split('?v=')[1]}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0` : ''}
          allow="autoplay"
          title="Music Player"
        />
      </div>
    </div>
  );
};

export default MusicPlayer;
