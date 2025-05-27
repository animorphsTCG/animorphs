
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiClient, Song } from "@/lib/api";
import { ArrowLeft, Play, Pause, Music as MusicIcon, Lock, Crown } from "lucide-react";
import { Link } from "react-router-dom";

interface MusicProps {
  user: any;
}

const Music = ({ user }: MusicProps) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [userSongs, setUserSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);

  useEffect(() => {
    loadMusic();
  }, [user.id]);

  const loadMusic = async () => {
    try {
      setIsLoading(true);
      
      // Load all available songs
      const allSongs = await apiClient.getSongs();
      setSongs(allSongs);

      // Load user's selected songs if not in demo mode
      if (user.id !== 0) {
        const userSelectedSongs = await apiClient.getUserSongs(user.id);
        setUserSongs(userSelectedSongs);
        setSelectedSongs(userSelectedSongs.map(s => s.id));
      } else {
        // Demo mode - allow first 5 songs
        const demoSongs = allSongs.slice(0, 5);
        setUserSongs(demoSongs);
        setSelectedSongs(demoSongs.map(s => s.id));
      }
    } catch (error) {
      toast({
        title: "Failed to load music",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSongSelection = (songId: number) => {
    if (user.has_battle_pass) {
      // Battle Pass holders have access to all songs
      if (selectedSongs.includes(songId)) {
        setSelectedSongs(prev => prev.filter(id => id !== songId));
      } else {
        setSelectedSongs(prev => [...prev, songId]);
      }
    } else {
      // Free users limited to 5 songs
      if (selectedSongs.includes(songId)) {
        setSelectedSongs(prev => prev.filter(id => id !== songId));
      } else if (selectedSongs.length < 5) {
        setSelectedSongs(prev => [...prev, songId]);
      } else {
        toast({
          title: "Free Limit Reached",
          description: "Free users can select up to 5 songs. Get Battle Pass for unlimited access!",
          variant: "destructive",
        });
      }
    }
  };

  const saveSelection = async () => {
    try {
      await apiClient.selectFreeSongs(selectedSongs);
      toast({
        title: "Selection Saved",
        description: "Your music selection has been updated",
      });
      await loadMusic();
    } catch (error) {
      toast({
        title: "Failed to save selection",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const playPreview = (songId: number) => {
    // TODO: Implement actual audio playback
    if (currentlyPlaying === songId) {
      setCurrentlyPlaying(null);
      toast({
        title: "Music Stopped",
        description: "Playback stopped",
      });
    } else {
      setCurrentlyPlaying(songId);
      const song = songs.find(s => s.id === songId);
      toast({
        title: "Now Playing",
        description: song?.title || "Unknown Song",
      });
      
      // Simulate playback duration
      setTimeout(() => {
        setCurrentlyPlaying(null);
      }, 30000); // 30 second preview
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading music library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-white">Music Library</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user.has_battle_pass ? (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Crown className="h-3 w-3 mr-1" />
                  Battle Pass
                </Badge>
              ) : (
                <Badge variant="outline" className="text-white border-white">
                  Free Tier ({selectedSongs.length}/5)
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Music Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Total Library</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{songs.length}</div>
              <p className="text-sm text-gray-300">Songs available</p>
            </CardContent>
          </Card>
          
          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{selectedSongs.length}</div>
              <p className="text-sm text-gray-300">
                {user.has_battle_pass ? "Unlimited access" : "Out of 5 free"}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Access Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">
                {user.has_battle_pass ? "Premium" : "Free"}
              </div>
              <p className="text-sm text-gray-300">
                {user.has_battle_pass ? "All features unlocked" : "Limited selection"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Battle Pass Promotion */}
        {!user.has_battle_pass && (
          <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-white mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-6 w-6 text-yellow-400" />
                <span>Upgrade to Battle Pass</span>
              </CardTitle>
              <CardDescription className="text-gray-200">
                Unlock all 235 songs plus cash-prize tournaments for only R30 ZAR/year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
                Get Battle Pass
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Music Categories */}
        <div className="space-y-8">
          {/* Selected Songs */}
          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MusicIcon className="h-5 w-5 text-green-400" />
                <span>Your Selected Songs ({selectedSongs.length})</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Songs you can play during battles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userSongs.length > 0 ? (
                <div className="space-y-2">
                  {userSongs.map((song) => (
                    <div key={song.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Button
                          size="sm"
                          variant={currentlyPlaying === song.id ? "secondary" : "outline"}
                          onClick={() => playPreview(song.id)}
                          className="w-8 h-8 p-0"
                        >
                          {currentlyPlaying === song.id ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </Button>
                        <div>
                          <div className="font-medium">{song.title}</div>
                          <div className="text-sm text-gray-400">{formatDuration(song.duration)}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleSongSelection(song.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <MusicIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No songs selected yet</p>
                  <p className="text-sm">Choose from the library below</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Songs */}
          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Music Library</CardTitle>
              <CardDescription className="text-gray-300">
                Browse and select songs for your playlist
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {songs.map((song) => {
                  const isSelected = selectedSongs.includes(song.id);
                  const canSelect = user.has_battle_pass || selectedSongs.length < 5 || isSelected;
                  
                  return (
                    <div key={song.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isSelected ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5 hover:bg-white/10'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Button
                          size="sm"
                          variant={currentlyPlaying === song.id ? "secondary" : "outline"}
                          onClick={() => playPreview(song.id)}
                          className="w-8 h-8 p-0"
                        >
                          {currentlyPlaying === song.id ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </Button>
                        <div>
                          <div className="font-medium">{song.title}</div>
                          <div className="text-sm text-gray-400">{formatDuration(song.duration)}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!user.has_battle_pass && !canSelect && (
                          <Lock className="h-4 w-4 text-gray-400" />
                        )}
                        <Button
                          size="sm"
                          variant={isSelected ? "secondary" : "outline"}
                          onClick={() => toggleSongSelection(song.id)}
                          disabled={!canSelect}
                          className={isSelected ? "text-green-400" : ""}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {user.id !== 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <Button
                    onClick={saveSelection}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Save Selection
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Music;
