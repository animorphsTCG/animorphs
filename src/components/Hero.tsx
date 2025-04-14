
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Gamepad2 } from "lucide-react";

const Hero = () => {
  return <section className="min-h-[600px] flex items-center justify-center relative overflow-hidden py-20">
      <div className="absolute inset-0 z-0">
        {/* Animated background elements */}
        <div className="absolute top-20 left-1/4 w-24 h-24 rounded-full bg-fantasy-primary opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-1/3 w-32 h-32 rounded-full bg-fantasy-secondary opacity-20 animate-float" style={{
        animationDelay: '1s'
      }}></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-fantasy-accent opacity-20 animate-float" style={{
        animationDelay: '2s'
      }}></div>
      </div>
      
      <div className="container mx-auto px-4 z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-fantasy-accent via-fantasy-primary to-fantasy-secondary bg-clip-text text-transparent">
            Welcome to Animorphs
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">Transforming play into purpose by investing in a brighter future for everyone!</p>
          
          <div className="mb-8">
            <Link to="/terms-and-conditions" className="text-fantasy-accent hover:underline inline-flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Read our Terms and Conditions
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
            <Link to="/register">
              <Button className="fantasy-button text-lg px-8 py-6">
                Register Now
              </Button>
            </Link>
            <Link to="/card-gallery">
              <Button className="fantasy-button-secondary text-lg px-8 py-6">Animorph Cards</Button>
            </Link>
          </div>
          
          {/* New Demo Battle Button */}
          <div className="mt-6">
            <Link to="/visitor-demo-battle">
              <Button className="bg-fantasy-accent hover:bg-fantasy-accent/80 text-black font-bold text-lg px-10 py-6 animate-pulse">
                <Gamepad2 className="mr-2 h-6 w-6" />
                Try Demo Battle!
              </Button>
            </Link>
            <p className="text-sm text-gray-300 mt-2">No registration required</p>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;
