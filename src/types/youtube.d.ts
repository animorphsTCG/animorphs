
// Type definitions for YouTube IFrame API
interface YT {
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
  Player: {
    new (
      elementId: string, 
      options: {
        height?: string | number;
        width?: string | number;
        videoId?: string;
        playerVars?: {
          autoplay?: 0 | 1;
          controls?: 0 | 1;
          start?: number;
          end?: number;
          mute?: 0 | 1;
          [key: string]: any;
        };
        events?: {
          onReady?: (event: any) => void;
          onStateChange?: (event: any) => void;
          onError?: (event: any) => void;
          [key: string]: any;
        };
      }
    ): YT.Player;
  };
}

interface YTPlayer {
  loadVideoById(videoIdOrOptions: string | object, startSeconds?: number): void;
  cueVideoById(videoIdOrOptions: string | object): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  destroy(): void;
}

declare namespace YT {
  interface Player extends YTPlayer {}
}

interface Window {
  YT: YT;
  onYouTubeIframeAPIReady: () => void;
}
