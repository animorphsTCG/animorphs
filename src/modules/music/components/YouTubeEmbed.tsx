
import React, { useEffect, MutableRefObject } from "react";
import { Song } from "@/types/music";

interface YouTubeEmbedProps {
  currentSong: Song | null;
  isPlaying: boolean;
  isMuted: boolean;
  isPreviewMode: boolean;
  ytApiReady: boolean;
  playerRef: MutableRefObject<any>; // Using any for YT.Player to avoid TS issues
  extractVideoId: (url: string) => string;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  currentSong,
  isPlaying,
  isMuted,
  isPreviewMode,
  ytApiReady,
  playerRef,
  extractVideoId,
}) => {
  useEffect(() => {
    if (ytApiReady && currentSong && window.YT) {
      try {
        const videoId = extractVideoId(currentSong.youtube_url);
        console.log("Extracted video ID:", videoId);
        
        if (!videoId) {
          console.error("Invalid YouTube URL:", currentSong.youtube_url);
          return;
        }

        if (!playerRef.current) {
          // Initialize new player
          console.log("Creating new YouTube player for:", videoId);
          // We create a new player but don't directly assign it to playerRef.current
          // The player will be assigned in the onReady event
          new window.YT.Player('youtube-player', {
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
                playerRef.current = event.target;
                console.log("YouTube player ready, id:", videoId);
                if (isPlaying && !isMuted) {
                  event.target.playVideo();
                }
              },
              onError: (e) => console.error("YouTube player error:", e)
            }
          });
        } else {
          console.log("Using existing player for:", videoId);
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
  }, [currentSong, ytApiReady, extractVideoId]);

  useEffect(() => {
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

  if (!currentSong) return null;

  return (
    <div className="hidden">
      <div id="youtube-player"></div>
    </div>
  );
};

export default YouTubeEmbed;
