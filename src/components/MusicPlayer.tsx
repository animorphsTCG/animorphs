
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/modules/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Song, R2Song } from "@/types/music.d";
import { Loader2, AlertCircle } from "lucide-react";
import SongInfo from "./music/SongInfo";
import PlaybackControls from "./music/PlaybackControls";
import VolumeControl from "./music/VolumeControl";
import YouTubeEmbed from "./music/YouTubeEmbed";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/modules/music/hooks/useMusicPlayer";

// Removed redundant declaration that was causing the type conflict
// The global YouTube type definitions are now only defined in src/types/youtube.d.ts

const MusicPlayer: React.FC = () => {
  const {
    isPlaying,
    currentSong,
    songs,
    volume,
    isMuted,
    hasSubscription,
    isPreviewMode,
    isLoading,
    error,
    ytApiReady,
    playerRef,
    togglePlay,
    nextSong,
    prevSong,
    toggleMute,
    handleVolumeChange,
    handleRetry
  } = useMusicPlayer();
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (isLoading) {
    return (
      <div className="bg-black/60 border border-fantasy-primary/30 rounded-md p-3">
        <div className="flex items-center">
          <div className="animate-pulse space-y-2 w-full">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
          <Loader2 className="h-5 w-5 animate-spin ml-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black/60 border border-fantasy-primary/30 rounded-md p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="font-medium">Music Player Error</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Make TypeScript happy by using a type assertion since we've unified the interfaces
  const typedCurrentSong = currentSong as (Song | null);

  return (
    <div className="bg-black/60 border border-fantasy-primary/30 rounded-md p-3">
      <div className="flex items-center justify-between">
        <SongInfo
          currentSong={typedCurrentSong}
          isPreviewMode={isPreviewMode}
          hasSubscription={hasSubscription}
        />
        
        <div className="flex items-center gap-4">
          <PlaybackControls
            isPlaying={isPlaying}
            hasSongs={songs.length > 0}
            onPlayPause={togglePlay}
            onPrevious={prevSong}
            onNext={nextSong}
          />
          
          <VolumeControl
            settings={{ volume, isMuted }}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={toggleMute}
          />
        </div>
      </div>

      <YouTubeEmbed
        currentSong={typedCurrentSong}
        isPlaying={isPlaying}
        isMuted={isMuted}
        isPreviewMode={isPreviewMode}
        ytApiReady={ytApiReady}
        iframeRef={iframeRef}
        playerRef={playerRef}
      />
    </div>
  );
};

export default MusicPlayer;
