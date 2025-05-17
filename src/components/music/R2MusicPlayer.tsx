
import React, { useState, useEffect, useRef } from 'react';
import { Song } from '@/types/music.d';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface R2MusicPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  getSongStreamUrl?: (songName: string) => Promise<string>;
}

const R2MusicPlayer: React.FC<R2MusicPlayerProps> = ({
  currentSong,
  isPlaying,
  isMuted,
  volume,
  getSongStreamUrl
}) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load song when currentSong changes
  useEffect(() => {
    const loadSong = async () => {
      if (!currentSong) {
        setStreamUrl(null);
        return;
      }

      // Check if it's an R2 song (has name property)
      if ('name' in currentSong) {
        if (!getSongStreamUrl) {
          console.error("getSongStreamUrl function is required for R2 songs");
          return;
        }
        
        try {
          setIsLoading(true);
          const url = await getSongStreamUrl(currentSong.name);
          setStreamUrl(url);
        } catch (error) {
          console.error("Failed to get stream URL:", error);
          toast({
            title: "Error",
            description: "Failed to load song from R2 storage",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      } 
      // Check if it has an r2_url directly
      else if ('r2_url' in currentSong && currentSong.r2_url) {
        setStreamUrl(currentSong.r2_url);
      }
      // If it's a YouTube song, we don't handle it here
    };

    loadSong();
  }, [currentSong, getSongStreamUrl]);

  // Handle audio element creation and cleanup
  useEffect(() => {
    if (!streamUrl) return;

    if (!audioRef.current) {
      const audio = new Audio(streamUrl);
      
      audio.onended = () => {
        // Signal that song has ended
        const event = new CustomEvent('r2song:ended');
        document.dispatchEvent(event);
      };
      
      audio.onerror = () => {
        toast({
          title: "Playback Error",
          description: "Failed to play the audio file",
          variant: "destructive"
        });
      };
      
      audioRef.current = audio;
    } else {
      audioRef.current.src = streamUrl;
      audioRef.current.load();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [streamUrl]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, audioRef.current]);

  // Handle mute/unmute
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = isMuted;
  }, [isMuted]);

  // Handle volume changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume / 100;
  }, [volume]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-2">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return null; // This component doesn't render anything visible
};

export default R2MusicPlayer;
