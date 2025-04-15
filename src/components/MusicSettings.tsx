
import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Lock, Unlock } from "lucide-react";

interface Song {
  id: string;
  title: string;
  youtube_url: string;
}

const MusicSettings: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [favouriteSongs, setFavouriteSongs] = useState<string[]>([]);
  const [volume, setVolume] = useState(50);
  const [musicEnabled, setMusicEnabled] = useState(true);

  // Fetch songs and user settings
  useEffect(() => {
    const fetchMusicData = async () => {
      if (!user) return;

      // Fetch all songs
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
      
      if (settingsData) {
        setSelectedSongs(settingsData.selected_songs || []);
        setFavouriteSongs(settingsData.favourite_songs || []);
        setVolume(settingsData.volume_level * 100);
        setMusicEnabled(settingsData.music_enabled);
      }
    };

    fetchMusicData();
  }, [user]);

  // Update user settings
  const updateUserSettings = async () => {
    if (!user) return;

    await supabase
      .from('user_music_settings')
      .update({
        selected_songs: selectedSongs,
        favourite_songs: favouriteSongs,
        volume_level: volume / 100,
        music_enabled: musicEnabled
      })
      .eq('user_id', user.id);
  };

  // Toggle song selection (max 5 for free users)
  const toggleSongSelection = (songId: string) => {
    if (selectedSongs.includes(songId)) {
      setSelectedSongs(selectedSongs.filter(id => id !== songId));
    } else if (selectedSongs.length < 5 || userProfile?.has_paid) {
      setSelectedSongs([...selectedSongs, songId]);
    }
  };

  // Toggle favourite song
  const toggleFavouriteSong = (songId: string) => {
    if (favouriteSongs.includes(songId)) {
      setFavouriteSongs(favouriteSongs.filter(id => id !== songId));
    } else {
      setFavouriteSongs([...favouriteSongs, songId]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Music Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Music Enabled</span>
          <Switch 
            checked={musicEnabled}
            onCheckedChange={(checked) => {
              setMusicEnabled(checked);
              updateUserSettings();
            }}
          />
        </div>

        <div>
          <label className="block mb-2">Volume</label>
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={(value) => {
              setVolume(value[0]);
              updateUserSettings();
            }}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Song Selection</h3>
          <div className="grid grid-cols-2 gap-2">
            {songs.map(song => (
              <div 
                key={song.id} 
                className={`
                  p-2 rounded-lg flex justify-between items-center 
                  ${selectedSongs.includes(song.id) ? 'bg-fantasy-accent/20' : 'bg-gray-100'}
                  ${!userProfile?.has_paid && selectedSongs.length >= 5 && !selectedSongs.includes(song.id) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer'}
                `}
                onClick={() => toggleSongSelection(song.id)}
              >
                <span>{song.title}</span>
                <div className="flex items-center space-x-2">
                  {favouriteSongs.includes(song.id) ? (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavouriteSong(song.id);
                      }}
                      className="text-yellow-500 hover:text-yellow-600"
                    >
                      ★
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavouriteSong(song.id);
                      }}
                      className="text-gray-400 hover:text-yellow-500"
                    >
                      ☆
                    </Button>
                  )}
                  {!userProfile?.has_paid && selectedSongs.length >= 5 && !selectedSongs.includes(song.id) ? (
                    <Lock className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Unlock className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={updateUserSettings} 
          className="w-full"
        >
          Save Music Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default MusicSettings;
