
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, Check } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

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
  const [previewPlayer, setPreviewPlayer] = useState<YT.Player | null>(null);

  useEffect(() => {
    fetchSongs();
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
    if (playingPreview === songId) {
      previewPlayer?.pauseVideo();
      setPlayingPreview(null);
    } else {
      const videoId = youtubeUrl.split('v=')[1];
      if (!previewPlayer) {
        // Create new player
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
      } else {
        // Use existing player
        previewPlayer.loadVideoById({
          videoId,
          startSeconds: songs.find(s => s.id === songId)?.preview_start_seconds || 0,
        });
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
