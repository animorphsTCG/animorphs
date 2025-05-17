
import React, { useEffect, useState } from "react";
import { Song } from "@/types/music";
import { R2Song } from "@/hooks/useR2Songs";

interface YouTubeEmbedProps {
  currentSong: Song | R2Song | null;
  isPlaying: boolean;
  isMuted: boolean;
  isPreviewMode: boolean;
  ytApiReady: boolean;
  playerRef: React.MutableRefObject<any>;
  iframeRef?: React.RefObject<HTMLIFrameElement>;
  extractVideoId?: (url: string) => string;
}

// This component handles YouTube video embedding
const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  currentSong,
  isPlaying,
  isMuted,
  isPreviewMode,
  ytApiReady,
  playerRef,
  iframeRef,
  extractVideoId = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v') || '';
      }
      if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1);
      }
    } catch (e) {
      console.error("Invalid URL format:", url);
    }
    return '';
  }
}) => {
  const [videoId, setVideoId] = useState<string>("");
  
  // Handle song changes
  useEffect(() => {
    if (!currentSong) return;
    
    // Skip if this is an R2 song (indicated by r2_key or r2_url property)
    if ('r2_key' in currentSong || 'r2_url' in currentSong) {
      setVideoId("");
      return;
    }
    
    // Handle YouTube song
    if ('youtube_url' in currentSong && currentSong.youtube_url) {
      const id = extractVideoId(currentSong.youtube_url);
      setVideoId(id);
    }
  }, [currentSong, extractVideoId]);
  
  // Initialize YouTube player
  useEffect(() => {
    if (!ytApiReady || !videoId) return;
    
    // Clean up existing player if any
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    
    try {
      // Create a new player
      playerRef.current = new window.YT.Player(iframeRef?.current || "youtube-player", {
        height: "0",
        width: "0",
        videoId: videoId,
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 0,
          showinfo: 0,
          rel: 0,
          iv_load_policy: 3,
          fs: 0,
          modestbranding: 1,
          disablekb: 1,
        },
        events: {
          onReady: (event: any) => {
            if (isPlaying) {
              event.target.playVideo();
            }
            if (isMuted) {
              event.target.mute();
            } else {
              event.target.unMute();
            }
            
            if (isPreviewMode && currentSong && 'preview_start_seconds' in currentSong) {
              event.target.seekTo(currentSong.preview_start_seconds || 0);
            }
          },
        },
      });
    } catch (error) {
      console.error("YouTube player initialization error:", error);
    }
  }, [videoId, ytApiReady, iframeRef]);
  
  // Handle play state changes
  useEffect(() => {
    if (!playerRef.current || !ytApiReady || !videoId) return;
    
    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (error) {
      console.error("YouTube player control error:", error);
    }
  }, [isPlaying, playerRef, ytApiReady, videoId]);
  
  // Handle mute state changes
  useEffect(() => {
    if (!playerRef.current || !ytApiReady || !videoId) return;
    
    try {
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    } catch (error) {
      console.error("YouTube player mute error:", error);
    }
  }, [isMuted, playerRef, ytApiReady, videoId]);
  
  return (
    <div className="hidden">
      <div id="youtube-player"></div>
    </div>
  );
};

export default YouTubeEmbed;
