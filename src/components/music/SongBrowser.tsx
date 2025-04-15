
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Song } from "@/types/music";

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchSongs();
      loadYouTubeApi();
    }

    return () => {
      if (previewPlayer) {
        try {
          previewPlayer.destroy();
          setPreviewPlayer(null);
        } catch (error) {
          console.error("Error destroying YouTube player:", error);
        }
      }
    };
  }, [open]);

  const loadYouTubeApi = () => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        setYtApiReady(true);
      };
    } else {
      setYtApiReady(true);
    }
  };

  const fetchSongs = async () => {
    try {
      setIsLoading(true);
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
    } catch (err) {
      console.error("Error fetching songs:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load song browser",
      });
    } finally {
      setIsLoading(false);
    }
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
        try {
          previewPlayer.pauseVideo();
        } catch (err) {
          console.error("Error pausing YouTube player:", err);
        }
      }
      setPlayingPreview(null);
    } else {
      const videoId = extractYoutubeId(youtubeUrl);
      if (!videoId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid YouTube URL",
        });
        return;
      }
      
      const songData = songs.find(s => s.id === songId);
      const previewStartTime = songData?.preview_start_seconds || 0;

      if (!previewPlayer) {
        try {
          const player = new window.YT.Player('preview-player', {
            height: '0',
            width: '0',
            videoId,
            playerVars: {
              autoplay: 1,
              start: previewStartTime,
            },
            events: {
              onStateChange: (event: any) => {
                if (event.data === window.YT.PlayerState.ENDED) {
                  setPlayingPreview(null);
                }
              }
            }
          });
          setPreviewPlayer(player);
        } catch (err) {
          console.error("Error creating YouTube player:", err);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to play preview",
          });
          return;
        }
      } else {
        try {
          previewPlayer.loadVideoById({
            videoId,
            startSeconds: previewStartTime,
          });
        } catch (err) {
          console.error("Error loading YouTube video:", err);
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

  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
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
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading available songs...</p>
          </div>
        ) : (
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-2">
              {songs.length === 0 ? (
                <div className="text-center p-8">
                  <p>No songs available.</p>
                </div>
              ) : (
                songs.map((song) => (
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
                ))
              )}
            </div>
          </ScrollArea>
        )}
        <div id="preview-player" style={{ display: 'none' }}></div>
      </DialogContent>
    </Dialog>
  );
};

export default SongBrowser;
