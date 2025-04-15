
import React from "react";
import { Song } from "@/types/music";

interface YouTubeEmbedProps {
  currentSong: Song | null;
  isPlaying: boolean;
  isMuted: boolean;
  isPreviewMode: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  currentSong,
  isPlaying,
  isMuted,
  isPreviewMode,
  iframeRef,
}) => {
  if (!currentSong) return null;

  const videoId = currentSong.youtube_url.split('?v=')[1];
  
  return (
    <div className="hidden">
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&start=${isPreviewMode ? currentSong.preview_start_seconds : 0}`}
        allow="autoplay"
        title="Music Player"
      />
    </div>
  );
};

export default YouTubeEmbed;
