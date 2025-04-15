
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  hasSongs: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  hasSongs,
  onPlayPause,
  onPrevious,
  onNext,
}) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        disabled={!hasSongs}
        className="h-8 w-8 text-gray-300 hover:bg-fantasy-primary/20"
      >
        <SkipBack className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onPlayPause}
        disabled={!hasSongs}
        className="h-8 w-8 text-gray-300 hover:bg-fantasy-primary/20"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={!hasSongs}
        className="h-8 w-8 text-gray-300 hover:bg-fantasy-primary/20"
      >
        <SkipForward className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PlaybackControls;
