
import React, { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/modules/auth";
import { d1Worker } from "@/lib/cloudflare/d1Worker";
import { toast } from "@/components/ui/use-toast";

const SettingsControls: React.FC = () => {
  const { user, token } = useAuth();
  const [volume, setVolume] = useState(50);
  const [musicEnabled, setMusicEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user || !token?.access_token) return;

    try {
      // Fetch music settings from D1
      const settings = await d1Worker.getOne(
        'SELECT * FROM user_music_settings WHERE user_id = ?',
        { params: [user.id] },
        token.access_token
      );

      if (settings) {
        setVolume(settings.volume_level * 100);
        setMusicEnabled(settings.music_enabled);
      }
    } catch (err) {
      console.error("Error fetching music settings:", err);
    }
  };

  const updateSettings = async (newVolume?: number, newEnabled?: boolean) => {
    if (!user || !token?.access_token) return;

    try {
      const volumeToSave = (newVolume ?? volume) / 100;
      const enabledToSave = newEnabled ?? musicEnabled;

      // Check if settings exist
      const existingSettings = await d1Worker.getOne(
        'SELECT * FROM user_music_settings WHERE user_id = ?',
        { params: [user.id] },
        token.access_token
      );

      if (!existingSettings) {
        // Create new settings
        await d1Worker.insert(
          'user_music_settings',
          {
            user_id: user.id,
            volume_level: volumeToSave,
            music_enabled: enabledToSave
          },
          '',
          token.access_token
        );
      } else {
        // Update existing settings
        await d1Worker.update(
          'user_music_settings',
          {
            volume_level: volumeToSave,
            music_enabled: enabledToSave
          },
          'user_id = ?',
          [user.id],
          '',
          token.access_token
        );
      }
    } catch (err) {
      console.error("Error updating music settings:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update settings",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span>Music Enabled</span>
        <Switch
          checked={musicEnabled}
          onCheckedChange={(checked) => {
            setMusicEnabled(checked);
            updateSettings(undefined, checked);
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
            updateSettings(value[0]);
          }}
        />
      </div>
    </div>
  );
};

export default SettingsControls;
