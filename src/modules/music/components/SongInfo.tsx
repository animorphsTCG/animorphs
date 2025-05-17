
import React from "react";
import { Lock } from "lucide-react";
import { Song } from "@/types/music.d";

interface SongInfoProps {
  currentSong: Song | null;
  isPreviewMode: boolean;
  hasSubscription: boolean;
}

const SongInfo: React.FC<SongInfoProps> = ({ 
  currentSong, 
  isPreviewMode, 
  hasSubscription 
}) => {
  return (
    <div className="flex-1 truncate">
      <p className="font-medium truncate">
        {currentSong?.title || "No song selected"}
      </p>
      <p className="text-xs text-gray-400">
        {isPreviewMode ? "Preview Mode" : "Music Player"}
        {!hasSubscription && (
          <span className="ml-2 text-yellow-400">
            <Lock className="inline-block h-3 w-3 mr-1" />
            Limited Access
          </span>
        )}
      </p>
    </div>
  );
};

export default SongInfo;
