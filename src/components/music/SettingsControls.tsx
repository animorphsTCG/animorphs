
import React, { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

const SettingsControls: React.FC = () => {
  const { user } = useAuth();
  const [volume, setVolume] = useState(50);
  const [musicEnabled, setMusicEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    const { data: settings, error } = await supabase
      .from('user_music_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && settings) {
      setVolume(settings.volume_level * 100);
      setMusicEnabled(settings.music_enabled);
    }
  };

  const updateSettings = async (newVolume?: number, newEnabled?: boolean) => {
    if (!user) return;

    const volumeToSave = (newVolume ?? volume) / 100;
    const enabledToSave = newEnabled ?? musicEnabled;

    const { error } = await supabase
      .from('user_music_settings')
      .upsert({
        user_id: user.id,
        volume_level: volumeToSave,
        music_enabled: enabledToSave,
      });

    if (error) {
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

