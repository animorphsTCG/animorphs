
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
import { Check, Music, Search, Loader2, Disc, Play } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useD1Songs } from '@/hooks/useD1Songs';
import { useR2Songs, R2Song } from '@/hooks/useR2Songs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import R2AudioPlayer from './R2AudioPlayer';

interface Song {
  id: string;
  title: string;
  youtube_url: string;
  r2_key?: string;
  r2_url?: string;
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
  const { songs: dbSongs, isLoading: dbLoading } = useD1Songs();
  const { songs: r2Songs, isLoading: r2Loading, getSongStreamUrl } = useR2Songs();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDbSongs, setFilteredDbSongs] = useState<Song[]>([]);
  const [filteredR2Songs, setFilteredR2Songs] = useState<R2Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('database');
  const [previewSong, setPreviewSong] = useState<R2Song | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open && !hasFetched) {
      handleSearch();
      setHasFetched(true);
    }
  }, [open]);

  useEffect(() => {
    if ((dbSongs && dbSongs.length > 0) || (r2Songs && r2Songs.length > 0)) {
      handleSearch();
    }
  }, [dbSongs, r2Songs, searchQuery]);

  const handleSearch = () => {
    if ((!dbSongs && !r2Songs) || (dbSongs.length === 0 && r2Songs.length === 0)) return;
    
    setIsSearching(true);
    
    try {
      const query = searchQuery.toLowerCase().trim();
      
      // Filter database songs
      let dbResults: Song[] = [];
      if (dbSongs && dbSongs.length > 0) {
        if (!query) {
          dbResults = dbSongs;
        } else {
          dbResults = dbSongs.filter(song => 
            song.title.toLowerCase().includes(query)
          );
        }
      }
      
      // Filter R2 songs
      let r2Results: R2Song[] = [];
      if (r2Songs && r2Songs.length > 0) {
        if (!query) {
          r2Results = r2Songs;
        } else {
          r2Results = r2Songs.filter(song => 
            song.title.toLowerCase().includes(query) ||
            (song.artist && song.artist.toLowerCase().includes(query))
          );
        }
      }
      
      setFilteredDbSongs(dbResults);
      setFilteredR2Songs(r2Results);
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
  
  // Handle R2 song preview
  const handlePreview = async (song: R2Song) => {
    try {
      setPreviewSong(song);
      const url = await getSongStreamUrl(song.name);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Error getting preview URL:', err);
      toast({
        title: "Preview Error",
        description: "Failed to load song preview",
        variant: "destructive"
      });
    }
  };
  
  // Clear preview
  const clearPreview = () => {
    setPreviewSong(null);
    setPreviewUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        clearPreview();
      }
    }}>
      <DialogContent className="sm:max-w-[600px]">
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="database">
              <Music className="h-4 w-4 mr-2" /> YouTube Songs
            </TabsTrigger>
            <TabsTrigger value="r2bucket">
              <Disc className="h-4 w-4 mr-2" /> R2 Songs
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="database">
            <div className="max-h-[300px] overflow-y-auto">
              {dbLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDbSongs.length > 0 ? (
                <div className="space-y-2">
                  {filteredDbSongs.map((song) => {
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
          </TabsContent>
          
          <TabsContent value="r2bucket">
            <div className="max-h-[300px] overflow-y-auto">
              {r2Loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredR2Songs.length > 0 ? (
                <div className="space-y-2">
                  {filteredR2Songs.map((song) => {
                    const isSelected = selectedSongs.includes(song.id);
                    const isPreviewActive = previewSong?.name === song.name;
                    
                    return (
                      <div
                        key={song.name}
                        className={`flex items-center justify-between p-2 rounded-md ${
                          isSelected ? 'bg-primary/10' : isPreviewActive ? 'bg-fantasy-accent/10' : 'hover:bg-accent/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Disc className="h-4 w-4 text-fantasy-accent" />
                          <div>
                            <div className="font-medium">{song.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {song.artist} • {(song.size / 1024 / 1024).toFixed(1)} MB
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePreview(song)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
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
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No R2 songs match your search.' : 'No R2 songs available.'}
                </div>
              )}
            </div>
            
            {previewSong && previewUrl && (
              <div className="mt-4 p-2 bg-black/30 rounded-md">
                <h4 className="text-sm font-medium mb-2">Preview:</h4>
                <R2AudioPlayer 
                  url={previewUrl} 
                  songName={previewSong.title}
                  autoPlay={true}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SongBrowser;
