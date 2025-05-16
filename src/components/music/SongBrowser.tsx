
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/modules/auth';
import { Check, Music, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { useD1Songs } from '@/hooks/useD1Database';

interface Song {
  id: string;
  title: string;
  youtube_url: string;
}

interface SongBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSongSelect: (songId: string) => void;
  selectedSongs: string[];
  hasSubscription: boolean;
}

const SongBrowser: React.FC<SongBrowserProps> = ({
  open,
  onOpenChange,
  onSongSelect,
  selectedSongs,
  hasSubscription
}) => {
  const { user } = useAuth();
  const { songs, isLoading } = useD1Songs();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (open && !hasFetched) {
      handleSearch();
      setHasFetched(true);
    }
  }, [open]);

  useEffect(() => {
    if (songs && songs.length > 0) {
      handleSearch();
    }
  }, [songs, searchQuery]);

  const handleSearch = () => {
    if (!songs) return;
    
    setIsSearching(true);
    
    try {
      const query = searchQuery.toLowerCase().trim();
      let results: Song[];
      
      if (!query) {
        // Show all songs if no search query
        results = songs;
      } else {
        // Filter by title
        results = songs.filter(song => 
          song.title.toLowerCase().includes(query)
        );
      }
      
      setFilteredSongs(results);
    } catch (error) {
      console.error('Error searching songs:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Check if user still has free song slots
  const canSelectMoreSongs = () => {
    const FREE_SONG_LIMIT = 5;
    return hasSubscription || selectedSongs.length < FREE_SONG_LIMIT;
  };

  // Check if user can select this specific song (based on subscription status)
  const canSelectSong = (songId: string) => {
    const FREE_SONG_LIMIT = 5;
    
    // If user has a subscription, they can select any song
    if (hasSubscription) return true;
    
    // If song is already selected, they can toggle it off
    if (selectedSongs.includes(songId)) return true;
    
    // If user is under the free limit, they can select more songs
    return selectedSongs.length < FREE_SONG_LIMIT;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Browse Songs</DialogTitle>
          <DialogDescription>
            {hasSubscription ? (
              "With your subscription, you can select unlimited songs."
            ) : (
              `Free users can select up to 5 songs. ${selectedSongs.length}/5 selected.`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 my-4">
          <Input
            placeholder="Search songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSongs.length > 0 ? (
            <div className="space-y-2">
              {filteredSongs.map((song) => {
                const isSelected = selectedSongs.includes(song.id);
                
                return (
                  <div
                    key={song.id}
                    className={`flex items-center justify-between p-2 rounded-md ${
                      isSelected ? 'bg-primary/10' : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium">{song.title}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {song.youtube_url}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => onSongSelect(song.id)}
                      disabled={!canSelectSong(song.id)}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-4 w-4 mr-1" /> Selected
                        </>
                      ) : (
                        'Select'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No songs match your search.' : 'No songs available.'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SongBrowser;
