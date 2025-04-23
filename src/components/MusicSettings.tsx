
import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Lock, Music } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import SongBrowser from './music/SongBrowser';
import MusicSubscription from './music/MusicSubscription';

interface Song {
  id: string;
  title: string;
  youtube_url: string;
}

interface MusicSubscription {
  subscription_type: 'monthly' | 'yearly';
  end_date: string;
}

const MusicSettings: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [volume, setVolume] = useState(50);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [showSongBrowser, setShowSongBrowser] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [subscription, setSubscription] = useState<MusicSubscription | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserSettings();
      fetchSubscription();
    }
  }, [user]);

  const fetchUserSettings = async () => {
    if (!user) return;

    try {
      // Fetch song selections
      const { data: selections, error: selectionsError } = await supabase
        .from('user_song_selections')
        .select('song_id')
        .eq('user_id', user.id);

      if (selectionsError) {
        console.error("Error fetching song selections:", selectionsError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch song selections",
        });
        return;
      }

      if (selections) {
        setSelectedSongs(selections.map(s => s.song_id));
        console.log("Fetched selected songs:", selections.length);
      }

      // Fetch volume settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_music_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!settingsError && settings) {
        setVolume(settings.volume_level * 100);
        setMusicEnabled(settings.music_enabled);
      } else if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error("Error fetching music settings:", settingsError);
      }
    } catch (error) {
      console.error("Error in fetchUserSettings:", error);
    }
  };

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('music_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setSubscription(data);
        console.log("User has music subscription:", data.subscription_type);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const handleSongSelect = async (songId: string) => {
    if (!user) return;

    try {
      const isSelected = selectedSongs.includes(songId);
      let newSelectedSongs: string[];

      if (isSelected) {
        // Remove song
        const { error } = await supabase
          .from('user_song_selections')
          .delete()
          .eq('user_id', user.id)
          .eq('song_id', songId);

        if (error) {
          console.error("Error removing song:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to remove song selection",
          });
          return;
        }

        newSelectedSongs = selectedSongs.filter(id => id !== songId);
      } else {
        // Add song
        const { error } = await supabase
          .from('user_song_selections')
          .insert({
            user_id: user.id,
            song_id: songId,
          });

        if (error) {
          console.error("Error adding song:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to add song selection",
          });
          return;
        }

        newSelectedSongs = [...selectedSongs, songId];
      }

      setSelectedSongs(newSelectedSongs);
      toast({
        title: "Success",
        description: isSelected ? "Song removed from your collection" : "Song added to your collection",
      });
    } catch (error) {
      console.error("Error in handleSongSelect:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update song selection",
      });
    }
  };

  const handleVolumeChange = async (value: number) => {
    setVolume(value);
    
    if (!user) return;
    
    try {
      // Check if settings exist
      const { data, error } = await supabase
        .from('user_music_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (!data) {
        // Create new settings
        await supabase
          .from('user_music_settings')
          .insert({
            user_id: user.id,
            volume_level: value / 100,
            music_enabled: musicEnabled
          });
      } else {
        // Update existing settings
        await supabase
          .from('user_music_settings')
          .update({
            volume_level: value / 100
          })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error("Error saving volume settings:", error);
    }
  };
  
  const handleMusicEnabledChange = async (enabled: boolean) => {
    setMusicEnabled(enabled);
    
    if (!user) return;
    
    try {
      // Check if settings exist
      const { data, error } = await supabase
        .from('user_music_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (!data) {
        // Create new settings
        await supabase
          .from('user_music_settings')
          .insert({
            user_id: user.id,
            volume_level: volume / 100,
            music_enabled: enabled
          });
      } else {
        // Update existing settings
        await supabase
          .from('user_music_settings')
          .update({
            music_enabled: enabled
          })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error("Error saving music enabled setting:", error);
    }
  };

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    // In a real implementation, this would integrate with a payment provider
    toast({
      title: "Coming Soon",
      description: "Subscription functionality will be available soon!",
    });
    setShowSubscription(false);
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
            onCheckedChange={handleMusicEnabledChange}
          />
        </div>

        <div>
          <label className="block mb-2">Volume</label>
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={(value) => handleVolumeChange(value[0])}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Song Collection</h3>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSongBrowser(true)}
              >
                Browse Songs
              </Button>
              {!subscription && (
                <Button
                  variant="default"
                  onClick={() => setShowSubscription(true)}
                >
                  Upgrade
                </Button>
              )}
            </div>
          </div>

          {!subscription && selectedSongs.length < 5 && (
            <p className="text-sm text-muted-foreground">
              Select up to 5 free songs for your collection
            </p>
          )}

          {subscription && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm">
                {subscription.subscription_type === 'monthly' ? 'Monthly' : 'Yearly'} subscription active
              </p>
              <p className="text-xs text-muted-foreground">
                Expires: {new Date(subscription.end_date).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        <SongBrowser
          open={showSongBrowser}
          onOpenChange={setShowSongBrowser}
          onSongSelect={handleSongSelect}
          selectedSongs={selectedSongs}
        />

        <MusicSubscription
          open={showSubscription}
          onOpenChange={setShowSubscription}
          onSubscribe={handleSubscribe}
        />
      </CardContent>
    </Card>
  );
};

export default MusicSettings;
