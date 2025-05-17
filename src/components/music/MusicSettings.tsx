
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/modules/auth";
import { useD1MusicSubscription, useD1UserSongs } from "@/hooks/useD1Database";
import { d1Worker } from "@/lib/cloudflare/d1Worker";
import SongBrowser from './SongBrowser';
import MusicSubscription from './MusicSubscription';
import { SettingsControls } from './SettingsControls';
import SongCollection from './SongCollection';

interface MusicSubscriptionType {
  subscription_type: 'monthly' | 'yearly';
  end_date: string;
}

const MusicSettings: React.FC = () => {
  const { user, token } = useAuth();
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [showSongBrowser, setShowSongBrowser] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [subscription, setSubscription] = useState<MusicSubscriptionType | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  
  // Use the D1 hooks
  const { subscription: musicSubscription, isLoading: subscriptionLoading } = 
    useD1MusicSubscription(user?.id);
  const { userSongs, addSong, removeSong, isLoading: songsLoading } = 
    useD1UserSongs(user?.id);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, musicSubscription, userSongs]);

  // Check if user has a music subscription
  const checkMusicSubscription = async (userId: string) => {
    try {
      console.log("Checking music subscription status in MusicSettings for user:", userId);
      
      if (!token?.access_token) return false;
      
      // First check if music_unlocked is true in the profile
      const profile = await d1Worker.getOne(
        'SELECT music_unlocked FROM profiles WHERE id = ?', 
        { params: [userId] },
        token.access_token
      );
      
      if (profile?.music_unlocked) {
        console.log("User has music_unlocked in profile");
        return true;
      }
      
      // Then check for an active subscription
      if (musicSubscription) {
        if (typeof musicSubscription === 'object' && 'end_date' in musicSubscription) {
          const endDate = new Date(musicSubscription.end_date);
          const now = new Date();
          
          if (endDate > now) {
            console.log("User has active music subscription until:", endDate.toISOString());
            return true;
          } else {
            console.log("User has expired music subscription:", endDate.toISOString());
          }
        }
      }
      
      return false;
    } catch (err) {
      console.error("Error in checkMusicSubscription:", err);
      return false;
    }
  };

  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      // Update song selections state from the hook data
      if (!songsLoading && userSongs) {
        setSelectedSongs(userSongs.map(song => song.song_id));
      }
      
      // Update subscription state
      const hasMusicSub = await checkMusicSubscription(user.id);
      setHasSubscription(hasMusicSub);
      
      // Update subscription details if available
      if (!subscriptionLoading && musicSubscription) {
        if (typeof musicSubscription === 'object' && 
            'subscription_type' in musicSubscription && 
            'end_date' in musicSubscription) {
          setSubscription({
            subscription_type: musicSubscription.subscription_type as 'monthly' | 'yearly',
            end_date: musicSubscription.end_date
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleSongSelect = async (songId: string) => {
    if (!user) return;

    const isSelected = selectedSongs.includes(songId);

    try {
      if (isSelected) {
        // Remove song using the hook
        const success = await removeSong(songId);
        if (success) {
          const newSelectedSongs = selectedSongs.filter(id => id !== songId);
          setSelectedSongs(newSelectedSongs);
          toast({
            title: "Success",
            description: "Song removed from your collection",
          });
        }
      } else {
        // Add song using the hook
        const success = await addSong(songId);
        if (success) {
          const newSelectedSongs = [...selectedSongs, songId];
          setSelectedSongs(newSelectedSongs);
          toast({
            title: "Success",
            description: "Song added to your collection",
          });
        }
      }
    } catch (error) {
      console.error("Error updating song selection:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update song selection",
      });
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
