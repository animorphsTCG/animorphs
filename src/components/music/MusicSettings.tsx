
import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/modules/auth"; // Updated import path
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import SongBrowser from './SongBrowser';
import MusicSubscription from './MusicSubscription';
import SettingsControls from './SettingsControls';
import SongCollection from './SongCollection';

const MusicSettings: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [showSongBrowser, setShowSongBrowser] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [subscription, setSubscription] = useState<{
    subscription_type: 'monthly' | 'yearly';
    end_date: string;
  } | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, userProfile]);

  // Check if user has a music subscription
  const checkMusicSubscription = async (userId: string) => {
    try {
      console.log("Checking music subscription status in MusicSettings for user:", userId);
      
      // First check if music_unlocked is true in the profile
      if (userProfile?.music_unlocked) {
        console.log("User has music_unlocked in profile");
        return true;
      }
      
      // Then check for an active subscription in the music_subscriptions table
      const { data, error } = await supabase
        .from('music_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error("Error checking music subscription:", error);
        }
        return false;
      }
      
      if (data) {
        const endDate = new Date(data.end_date);
        const now = new Date();
        
        if (endDate > now) {
          console.log("User has active music subscription until:", endDate.toISOString());
          return true;
        } else {
          console.log("User has expired music subscription:", endDate.toISOString());
        }
      }
      
      return false;
    } catch (err) {
      console.error("Error in checkMusicSubscription:", err);
      return false;
    }
  };

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Check subscription status
      const hasMusicSub = await checkMusicSubscription(user.id);
      setHasSubscription(hasMusicSub);
      
      console.log("Music subscription status in MusicSettings:", hasMusicSub);
      
      const { data: selections, error: selectionsError } = await supabase
        .from('user_song_selections')
        .select('song_id')
        .eq('user_id', user.id);

      if (selectionsError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch song selections",
        });
        return;
      }

      setSelectedSongs(selections?.map(s => s.song_id) || []);

      const { data, error } = await supabase
        .from('music_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setSubscription(data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleSongSelect = async (songId: string) => {
    if (!user) return;

    const isSelected = selectedSongs.includes(songId);
    let newSelectedSongs: string[];

    try {
      if (isSelected) {
        const { error } = await supabase
          .from('user_song_selections')
          .delete()
          .eq('user_id', user.id)
          .eq('song_id', songId);

        if (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to remove song selection",
          });
          return;
        }

        newSelectedSongs = selectedSongs.filter(id => id !== songId);
      } else {
        const { error } = await supabase
          .from('user_song_selections')
          .insert({
            user_id: user.id,
            song_id: songId,
          });

        if (error) {
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
      console.error("Error updating song selection:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Music Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingsControls />
        
        <SongCollection 
          selectedSongs={selectedSongs}
          subscription={subscription}
          hasSubscription={hasSubscription}
          onBrowseSongs={() => setShowSongBrowser(true)}
          onUpgrade={() => setShowSubscription(true)}
        />

        <SongBrowser
          open={showSongBrowser}
          onOpenChange={setShowSongBrowser}
          onSongSelect={handleSongSelect}
          selectedSongs={selectedSongs}
          hasSubscription={hasSubscription}
        />

        <MusicSubscription
          open={showSubscription}
          onOpenChange={setShowSubscription}
          onSubscribe={(plan) => {
            toast({
              title: "Coming Soon",
              description: "Subscription functionality will be available soon!",
            });
            setShowSubscription(false);
          }}
        />
      </CardContent>
    </Card>
  );
};

export default MusicSettings;
