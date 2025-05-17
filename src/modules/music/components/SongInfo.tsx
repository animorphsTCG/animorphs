
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Song, R2Song } from "@/types/music.d";

interface SongInfoProps {
  currentSong: Song | R2Song | null;
  isPreviewMode: boolean;
  hasSubscription: boolean;
}

const SongInfo: React.FC<SongInfoProps> = ({ 
  currentSong, 
  isPreviewMode, 
  hasSubscription 
}) => {
  if (!currentSong) {
    return (
      <div className="flex-1">
        <p className="font-medium">Select a Song</p>
        <p className="text-xs text-gray-400">No song selected</p>
      </div>
    );
  }

  // Determine if it's a YouTube or R2 song
  const isR2Song = 'name' in currentSong || 'r2_key' in currentSong;
  const artist = currentSong.artist || 'Unknown Artist';

  return (
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="font-medium truncate max-w-[200px] sm:max-w-[300px]">
          {currentSong.title}
        </p>
        
        {isPreviewMode && !hasSubscription && (
          <Badge variant="outline" className="text-xs bg-amber-800/20 border-amber-500/30">
            Preview
          </Badge>
        )}
        
        {isR2Song && (
          <Badge variant="outline" className="text-xs bg-green-800/20 border-green-500/30">
            R2
          </Badge>
        )}
      </div>
      
      <p className="text-xs text-gray-400">
        {artist}
      </p>
    </div>
  );
};

export default SongInfo;
