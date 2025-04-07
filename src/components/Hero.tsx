
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="min-h-[600px] flex items-center justify-center relative overflow-hidden py-20">
      <div className="absolute inset-0 z-0">
        {/* Animated background elements */}
        <div className="absolute top-20 left-1/4 w-24 h-24 rounded-full bg-fantasy-primary opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-1/3 w-32 h-32 rounded-full bg-fantasy-secondary opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-fantasy-accent opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="container mx-auto px-4 z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-fantasy-accent via-fantasy-primary to-fantasy-secondary bg-clip-text text-transparent">
            Animorph Battle Verse
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            Transform, battle, and conquer in this immersive card battle experience
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register">
              <Button className="fantasy-button text-lg px-8 py-6">
                Register Now
              </Button>
            </Link>
            <Link to="/card-gallery">
              <Button className="fantasy-button-secondary text-lg px-8 py-6">
                View Battle Cards
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
