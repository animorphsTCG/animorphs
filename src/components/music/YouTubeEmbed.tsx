
import React, { useEffect } from "react";
import { Song } from "@/types/music";

interface YouTubeEmbedProps {
  currentSong: Song | null;
  isPlaying: boolean;
  isMuted: boolean;
  isPreviewMode: boolean;
  ytApiReady: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  playerRef: React.RefObject<any>;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  currentSong,
  isPlaying,
  isMuted,
  isPreviewMode,
  ytApiReady,
  iframeRef,
  playerRef,
}) => {
  useEffect(() => {
    // Initialize or update YouTube player when current song changes
    if (ytApiReady && currentSong && window.YT) {
      try {
        const videoId = extractVideoId(currentSong.youtube_url);
        
        if (!videoId) {
          console.error("Invalid YouTube URL:", currentSong.youtube_url);
          return;
        }

        if (!playerRef.current) {
          // Initialize new player
          const newYTPlayer = new window.YT.Player('youtube-player', {
            height: '0',
            width: '0',
            videoId: videoId,
            playerVars: {
              autoplay: isPlaying ? 1 : 0,
              mute: isMuted ? 1 : 0,
              controls: 0,
              start: isPreviewMode ? currentSong.preview_start_seconds : 0,
            },
            events: {
              onReady: (event) => {
                // Safely assign to playerRef.current
                playerRef.current = event.target;
              },
              onError: (e: any) => console.error("YouTube player error:", e)
            }
          });
        } else {
          // Update existing player
          if (isPlaying) {
            playerRef.current.loadVideoById({
              videoId: videoId,
              startSeconds: isPreviewMode ? currentSong.preview_start_seconds : 0
            });
          } else {
            playerRef.current.cueVideoById({
              videoId: videoId,
              startSeconds: isPreviewMode ? currentSong.preview_start_seconds : 0
            });
          }
        }
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
      }
    }
  }, [currentSong, ytApiReady]);

  useEffect(() => {
    // Control playback state
    if (playerRef.current) {
      try {
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      } catch (error) {
        console.error("Error controlling YouTube playback:", error);
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    // Control volume/mute state
    if (playerRef.current) {
      try {
        if (isMuted) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
        }
      } catch (error) {
        console.error("Error controlling YouTube volume:", error);
      }
    }
  }, [isMuted]);

  const extractVideoId = (url: string): string => {
    if (!url) return '';
    
    // Handle direct video IDs
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return url;
    }
    
    // Handle youtube.com URLs
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      return urlParams.get('v') || '';
    }
    
    // Handle youtu.be URLs
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1].split('?')[0];
    }
    
    return '';
  };

  if (!currentSong) return null;

  return (
    <div className="hidden">
      <div id="youtube-player"></div>
    </div>
  );
};

export default YouTubeEmbed;
