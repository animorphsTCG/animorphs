
import React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX } from "lucide-react";
import { MusicSettings } from "@/types/music";

interface VolumeControlProps {
  settings: MusicSettings;
  onVolumeChange: (value: number[]) => void;
  onMuteToggle: () => void;
}

const VolumeControl: React.FC<VolumeControlProps> = ({
  settings,
  onVolumeChange,
  onMuteToggle,
}) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMuteToggle}
        className="h-8 w-8 text-gray-300 hover:bg-fantasy-primary/20"
      >
        {settings.isMuted || settings.volume === 0 ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      <div className="w-20">
        <Slider
          value={[settings.isMuted ? 0 : settings.volume]}
          max={100}
          step={1}
          onValueChange={onVolumeChange}
          className="h-1"
        />
      </div>
    </div>
  );
};

export default VolumeControl;
