
import React, { useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface R2AudioPlayerProps {
  url: string;
  songName: string;
  autoPlay?: boolean;
}

const R2AudioPlayer: React.FC<R2AudioPlayerProps> = ({ url, songName, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!url) return;
    
    const audio = new Audio(url);
    audioRef.current = audio;
    
    // Set up event listeners
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setError('Failed to load audio file');
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to load audio from R2 storage",
        variant: "destructive"
      });
    };
    
    // Set initial volume
    audio.volume = volume / 100;
    
    // Clean up on unmount
    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [url]);
  
  // Handle autoplay
  useEffect(() => {
    if (autoPlay && audioRef.current && !isLoading && !error) {
      togglePlay();
    }
  }, [autoPlay, isLoading, error]);

  // Effect to handle URL changes
  useEffect(() => {
    if (audioRef.current && url) {
      setIsLoading(true);
      setError(null);
      audioRef.current.src = url;
      audioRef.current.load();
      
      // If it was already playing, continue playing the new song
      if (isPlaying) {
        audioRef.current.play()
          .catch(err => {
            console.error('Error playing audio:', err);
            setIsPlaying(false);
          });
      }
    }
  }, [url]);
  
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play()
        .catch(err => {
          console.error('Error playing audio:', err);
          setError('Failed to play audio');
          toast({
            title: "Playback Error",
            description: "Could not play the selected song",
            variant: "destructive"
          });
        });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    const newMutedState = !isMuted;
    audioRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    
    if (!audioRef.current) return;
    
    audioRef.current.volume = newVolume / 100;
    setVolume(newVolume);
    
    if (newVolume > 0 && isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
    }
  };
  
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    
    const newPosition = value[0];
    audioRef.current.currentTime = newPosition;
    setCurrentTime(newPosition);
  };
  
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Jump backward 10 seconds
  const jumpBackward = () => {
    if (!audioRef.current) return;
    
    const newTime = Math.max(0, audioRef.current.currentTime - 10);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  // Jump forward 10 seconds
  const jumpForward = () => {
    if (!audioRef.current) return;
    
    const newTime = Math.min(duration, audioRef.current.currentTime + 10);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  if (error) {
    return (
      <div className="text-center p-4 border border-red-500/30 rounded-md bg-red-500/10">
        <p className="text-red-400">Error: {error}</p>
        <p className="text-sm text-gray-400 mt-1">
          The audio file might be unavailable or access is restricted.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-black/50 p-4">
      <div className="mb-2 text-lg font-medium truncate">
        {songName}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-20">
          <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.01}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-sm">{formatTime(duration)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={jumpBackward}
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              
              <Button 
                onClick={togglePlay} 
                variant="default" 
                size="icon" 
                className="h-10 w-10 rounded-full bg-fantasy-accent hover:bg-fantasy-accent/80"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={jumpForward}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default R2AudioPlayer;
