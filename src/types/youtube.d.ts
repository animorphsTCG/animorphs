
// Type definitions for YouTube IFrame API
interface YT {
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
  Player: new (
    elementId: string,
    config: {
      height?: string | number;
      width?: string | number;
      videoId?: string;
      playerVars?: {
        autoplay?: 0 | 1;
        controls?: 0 | 1;
        start?: number;
        mute?: 0 | 1;
        [key: string]: any;
      };
      events?: {
        onReady?: (event: { target: YTPlayer }) => void;
        onStateChange?: (event: any) => void;
        onError?: (event: any) => void;
        [key: string]: any;
      };
    }
  ) => YTPlayer;
}

interface YTPlayer {
  loadVideoById(videoIdOrOptions: string | object, startSeconds?: number): void;
  cueVideoById(videoIdOrOptions: string | object, startSeconds?: number): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  destroy(): void;
  mute(): void;
  unMute(): void;
  getPlayerState(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoUrl(): string;
  getVideoData(): any;
}

declare namespace YT {
  interface Player extends YTPlayer {}
}

interface Window {
  YT: YT;
  onYouTubeIframeAPIReady: () => void;
}
