
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useR2Songs } from '@/hooks/useR2Songs';
import MusicPlayer from '@/modules/music/components/MusicPlayer';
import { Play, Disc, ListMusic } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import R2AudioPlayer from '@/components/music/R2AudioPlayer';

const Music = () => {
  const [activeTab, setActiveTab] = useState<string>('player');
  const { songs, isLoading, getSongStreamUrl } = useR2Songs();
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  
  const handleSongSelect = async (songName: string) => {
    setSelectedSong(songName);
    const url = await getSongStreamUrl(songName);
    setStreamUrl(url);
  };
  
  // Select first song by default if none selected
  useEffect(() => {
    if (songs.length > 0 && !selectedSong) {
      handleSongSelect(songs[0].name);
    }
  }, [songs, selectedSong]);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-fantasy-accent">Music Library</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="player">
            <Play className="mr-2 h-4 w-4" /> Music Player
          </TabsTrigger>
          <TabsTrigger value="library">
            <ListMusic className="mr-2 h-4 w-4" /> Song Library
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="player" className="space-y-4">
          <MusicPlayer />
          
          {streamUrl && (
            <Card className="bg-black/40 border border-fantasy-primary/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Direct R2 Audio Player</h3>
                <R2AudioPlayer 
                  url={streamUrl} 
                  songName={selectedSong || "Unknown Song"}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="library" className="space-y-4">
          <Card className="bg-black/40 border border-fantasy-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Disc className="mr-2 h-5 w-5" />
                R2 Music Collection ({songs.length} songs)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-9 w-20" />
                    </div>
                  ))}
                </div>
              ) : songs.length > 0 ? (
                <div className="max-h-[500px] overflow-y-auto space-y-2">
                  {songs.map((song) => (
                    <div 
                      key={song.name}
                      className={`flex items-center justify-between p-2 rounded-md border ${
                        song.name === selectedSong 
                          ? 'bg-fantasy-primary/20 border-fantasy-accent' 
                          : 'bg-black/30 border-gray-700 hover:bg-black/50'
                      }`}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{song.title}</h4>
                        <p className="text-sm text-gray-400">
                          {song.artist || 'Unknown Artist'} • {(song.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant={song.name === selectedSong ? "default" : "outline"} 
                        onClick={() => handleSongSelect(song.name)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {song.name === selectedSong ? "Playing" : "Play"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center p-4 text-gray-400">
                  No songs found in the R2 bucket.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="bg-black/40 rounded-lg p-6 border border-fantasy-primary/30">
        <h2 className="text-2xl font-bold mb-4">About the Music</h2>
        <p className="mb-4">
          The Animorphs Battle game features over 230 songs from the zypherdan R2 bucket,
          designed to enhance your gaming experience. Different tracks play during various game modes and battles.
        </p>
        <p>
          Browse the library tab to explore all available songs and play them directly from 
          Cloudflare R2 storage.
        </p>
      </div>
    </div>
  );
};

export default Music;
