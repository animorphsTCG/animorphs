
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, Check } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

// Add YouTube Player API type definition
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Define the YouTube Player API namespace
interface YT {
  Player: any;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare var YT: {
  Player: new (
    elementId: string, 
    options: {
      height?: string | number;
      width?: string | number;
      videoId?: string;
      playerVars?: {
        autoplay?: number;
        start?: number;
        [key: string]: any;
      };
      events?: {
        onReady?: (event: any) => void;
        onStateChange?: (event: any) => void;
        [key: string]: any;
      };
    }
  ) => any;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
};

interface Song {
  id: string;
  title: string;
  youtube_url: string;
  preview_start_seconds: number;
  preview_duration_seconds: number;
}

interface SongBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSongSelect: (songId: string) => void;
  selectedSongs: string[];
}

const SongBrowser: React.FC<SongBrowserProps> = ({
  open,
  onOpenChange,
  onSongSelect,
  selectedSongs,
}) => {
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [previewPlayer, setPreviewPlayer] = useState<any | null>(null);
  const [ytApiReady, setYtApiReady] = useState(false);

  useEffect(() => {
    fetchSongs();
    
    // Load YouTube iframe API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      // Set up the callback for when the API is ready
      window.onYouTubeIframeAPIReady = () => {
        setYtApiReady(true);
      };
    } else {
      setYtApiReady(true);
    }

    return () => {
      if (previewPlayer) {
        try {
          previewPlayer.destroy();
        } catch (error) {
          console.error("Error destroying YouTube player:", error);
        }
      }
    };
  }, []);

  const fetchSongs = async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('title');

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch songs",
      });
      return;
    }

    setSongs(data || []);
  };

  const handlePreviewClick = (songId: string, youtubeUrl: string) => {
    if (!ytApiReady) {
      toast({
        title: "Please wait",
        description: "YouTube player is loading...",
      });
      return;
    }

    if (playingPreview === songId) {
      if (previewPlayer) {
        previewPlayer.pauseVideo();
      }
      setPlayingPreview(null);
    } else {
      const urlParts = youtubeUrl.split('v=');
      const videoId = urlParts.length > 1 ? urlParts[1] : youtubeUrl;
      
      if (!previewPlayer) {
        // Create new player
        try {
          const player = new YT.Player('preview-player', {
            height: '0',
            width: '0',
            videoId,
            playerVars: {
              autoplay: 1,
              start: songs.find(s => s.id === songId)?.preview_start_seconds || 0,
            },
            events: {
              onStateChange: (event) => {
                if (event.data === YT.PlayerState.ENDED) {
                  setPlayingPreview(null);
                }
              }
            }
          });
          setPreviewPlayer(player);
        } catch (error) {
          console.error("Error creating YouTube player:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to play preview",
          });
          return;
        }
      } else {
        // Use existing player
        try {
          previewPlayer.loadVideoById({
            videoId,
            startSeconds: songs.find(s => s.id === songId)?.preview_start_seconds || 0,
          });
        } catch (error) {
          console.error("Error loading video:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to play preview",
          });
          return;
        }
      }
      setPlayingPreview(songId);
    }
  };

  const handleSongSelect = async (songId: string) => {
    if (!user) return;

    try {
      if (selectedSongs.length >= 5 && !selectedSongs.includes(songId)) {
        toast({
          variant: "destructive",
          title: "Selection limit reached",
          description: "You can only select up to 5 free songs. Subscribe for unlimited access!",
        });
        return;
      }

      onSongSelect(songId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to select song",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Browse Available Songs</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-2">
            {songs.map((song) => (
              <div
                key={song.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{song.title}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePreviewClick(song.id, song.youtube_url)}
                  >
                    {playingPreview === song.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant={selectedSongs.includes(song.id) ? "secondary" : "outline"}
                    onClick={() => handleSongSelect(song.id)}
                    disabled={selectedSongs.length >= 5 && !selectedSongs.includes(song.id)}
                  >
                    {selectedSongs.includes(song.id) ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : null}
                    {selectedSongs.includes(song.id) ? "Selected" : "Select"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div id="preview-player" style={{ display: 'none' }}></div>
      </DialogContent>
    </Dialog>
  );
};

export default SongBrowser;
