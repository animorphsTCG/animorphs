
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsControls } from './SettingsControls';
import { Music } from 'lucide-react';

interface MusicSettingsProps {
  onSettingsChange?: (settings: { volume_level: number; music_enabled: boolean }) => void;
}

const MusicSettings: React.FC<MusicSettingsProps> = ({ onSettingsChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Music Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SettingsControls onSettingsChange={onSettingsChange} />
      </CardContent>
    </Card>
  );
};

export default MusicSettings;
