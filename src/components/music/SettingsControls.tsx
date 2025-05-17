
import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/modules/auth';
import { d1Worker } from '@/lib/cloudflare/d1Worker';

interface MusicSettings {
  volume_level: number;
  music_enabled: boolean;
}

interface SettingsControlsProps {
  onSettingsChange?: (settings: MusicSettings) => void;
}

export function SettingsControls({ onSettingsChange }: SettingsControlsProps) {
  const { user, token } = useAuth();
  const [volume, setVolume] = useState(0.5);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id || !token?.access_token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await d1Worker.getOne<MusicSettings>(
          'SELECT * FROM user_music_settings WHERE user_id = ?',
          { params: [user.id] },
          token.access_token
        );

        if (result) {
          setVolume(result.volume_level);
          setEnabled(Boolean(result.music_enabled));
        }
      } catch (error) {
        console.error('Error fetching music settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, token]);

  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange({ volume_level: volume, music_enabled: enabled });
    }
  }, [volume, enabled, onSettingsChange]);

  const updateSettings = async () => {
    if (!user?.id || !token?.access_token) return;

    try {
      const existing = await d1Worker.getOne(
        'SELECT id FROM user_music_settings WHERE user_id = ?',
        { params: [user.id] },
        token.access_token
      );

      if (existing) {
        await d1Worker.execute(
          `UPDATE user_music_settings 
           SET volume_level = ?, music_enabled = ? 
           WHERE user_id = ?`,
          { params: [volume, enabled ? 1 : 0, user.id] },
          token.access_token
        );
      } else {
        const id = crypto.randomUUID();
        await d1Worker.execute(
          `INSERT INTO user_music_settings (id, user_id, volume_level, music_enabled) 
           VALUES (?, ?, ?, ?)`,
          { params: [id, user.id, volume, enabled ? 1 : 0] },
          token.access_token
        );
      }
    } catch (error) {
      console.error('Error saving music settings:', error);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    updateSettings();
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    updateSettings();
  };

  if (loading) {
    return <div className="text-center py-2">Loading settings...</div>;
  }

  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-0 space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="music-toggle" className="font-medium">
            Music
          </Label>
          <Switch
            id="music-toggle"
            checked={enabled}
            onCheckedChange={handleToggle}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="volume-slider" className="flex items-center gap-2">
              {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span>Volume</span>
            </Label>
            <span className="text-sm text-muted-foreground w-10 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <Slider
            id="volume-slider"
            defaultValue={[volume]}
            max={1}
            step={0.01}
            disabled={!enabled}
            onValueChange={handleVolumeChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
