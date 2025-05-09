
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const Music = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Placeholder function for when we implement music functionality
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-fantasy-accent">Music Player</h1>
      
      <Card className="bg-black/40 border border-fantasy-primary/30 mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-32 h-32 bg-fantasy-accent/20 rounded-full flex items-center justify-center mb-6">
              <span className="text-6xl">{isPlaying ? '▐▐' : '▶'}</span>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Currently No Music Available</h2>
            <p className="text-gray-400 mb-6">Music features coming soon!</p>
            
            <button
              onClick={togglePlay}
              className="bg-fantasy-accent text-black px-8 py-3 rounded-md hover:bg-fantasy-accent/80 transition-colors"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-black/40 rounded-lg p-6 border border-fantasy-primary/30">
        <h2 className="text-2xl font-bold mb-4">About the Music</h2>
        <p className="mb-4">
          The Animorphs Battle game features an immersive soundtrack designed to enhance
          your gaming experience. Different tracks play during various game modes and battles.
        </p>
        <p>
          Music features are currently being developed and will be available in a future update.
          Stay tuned for announcements on when this feature will be released.
        </p>
      </div>
    </div>
  );
};

export default Music;
