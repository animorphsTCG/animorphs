
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX 
} from "lucide-react";

interface Song {
  id: number;
  title: string;
  youtube_url: string;
}

// Mock playlist - in a real implementation this would come from the database
const mockPlaylist: Song[] = [
  { id: 1, title: "Battle Theme 1", youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 2, title: "Epic Fight Music", youtube_url: "https://www.youtube.com/watch?v=ZZ5LpwO-An4" },
  { id: 3, title: "Fantasy Adventure", youtube_url: "https://www.youtube.com/watch?v=q6EoRBvdVPQ" },
];

const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  
  // Play/pause toggle
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Skip to next song
  const nextSong = () => {
    setCurrentSong((prev) => (prev + 1) % mockPlaylist.length);
  };
  
  // Go to previous song
  const prevSong = () => {
    setCurrentSong((prev) => (prev - 1 + mockPlaylist.length) % mockPlaylist.length);
  };
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] > 0 && isMuted) {
      setIsMuted(false);
    }
  };
  
  return (
    <div className="bg-black/60 border border-fantasy-primary/30 rounded-md p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 truncate">
          <p className="font-medium truncate">
            {mockPlaylist[currentSong]?.title || "No song selected"}
          </p>
          <p className="text-xs text-gray-400">Host's Playlist</p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevSong}
            className="h-8 w-8 text-gray-300 hover:bg-fantasy-primary/20"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={togglePlay}
            className="h-8 w-8 text-gray-300 hover:bg-fantasy-primary/20"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextSong}
            className="h-8 w-8 text-gray-300 hover:bg-fantasy-primary/20"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMute}
            className="h-8 w-8 text-gray-300 hover:bg-fantasy-primary/20"
          >
            {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <div className="w-20">
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="h-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
