
import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "../hooks/useMusicPlayer";
import SongInfo from "./SongInfo";
import PlaybackControls from "./PlaybackControls";
import VolumeControl from "./VolumeControl";
import YouTubeEmbed from "./YouTubeEmbed";
import R2MusicPlayer from "@/components/music/R2MusicPlayer";
import { Loader2 } from "lucide-react";

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
    handleRetry,
    extractVideoId,
    getSongStreamUrl
  } = useMusicPlayer();

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

  // Determine if this is an R2 song (has name property) or YouTube song (has youtube_url)
  const isR2Song = currentSong && ('name' in currentSong || 'r2_key' in currentSong);

  return (
    <div className="bg-black/60 border border-fantasy-primary/30 rounded-md p-3">
      <div className="flex items-center justify-between">
        <SongInfo
          currentSong={currentSong}
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

      {/* Conditionally render either R2 or YouTube player based on song type */}
      {isR2Song ? (
        <R2MusicPlayer
          currentSong={currentSong}
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          getSongStreamUrl={getSongStreamUrl}
        />
      ) : (
        <YouTubeEmbed
          currentSong={currentSong}
          isPlaying={isPlaying}
          isMuted={isMuted}
          isPreviewMode={isPreviewMode}
          ytApiReady={ytApiReady}
          playerRef={playerRef}
          extractVideoId={extractVideoId}
        />
      )}
    </div>
  );
};

export default MusicPlayer;
