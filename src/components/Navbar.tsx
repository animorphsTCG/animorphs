
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Users } from "lucide-react";
import { useAuth } from "@/contexts/ClerkAuthContext";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-black/80 backdrop-blur-sm sticky top-0 z-50 border-b border-fantasy-accent/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl md:text-3xl font-fantasy font-bold bg-gradient-to-r from-fantasy-accent to-fantasy-secondary bg-clip-text text-transparent">
              <span className="text-fantasy-accent">ANIMORPH</span> BATTLE
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-white hover:text-fantasy-accent transition-colors font-medium">
              Home
            </Link>
            <Link to="/card-gallery" className="text-white hover:text-fantasy-accent transition-colors font-medium">
              Cards
            </Link>
            <SignedIn>
              <Link to="/battle" className="text-white hover:text-fantasy-accent transition-colors font-medium">
                Battle
              </Link>
              <Link to="/search-users" className="text-white hover:text-fantasy-accent transition-colors font-medium">
                <Users className="h-4 w-4 inline mr-1" /> Players
              </Link>
            </SignedIn>
            
            <SignedIn>
              <Link 
                to="/profile" 
                className="text-white hover:text-fantasy-accent flex items-center gap-1"
              >
                <UserButton afterSignOutUrl="/" />
                <span className="ml-2">Profile</span>
              </Link>
            </SignedIn>
            
            <SignedOut>
              <Link to="/register">
                <Button className="fantasy-button mr-2">
                  Register
                </Button>
              </Link>
              <Link to="/login">
                <Button className="fantasy-button-secondary">
                  Login
                </Button>
              </Link>
            </SignedOut>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-white hover:text-fantasy-accent transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-3 border-t border-fantasy-primary/30 flex flex-col space-y-3">
            <Link to="/" className="text-white hover:text-fantasy-accent text-lg font-medium">
              Home
            </Link>
            <Link to="/card-gallery" className="text-white hover:text-fantasy-accent text-lg font-medium">
              Cards
            </Link>
            
            <SignedIn>
              <Link to="/battle" className="text-white hover:text-fantasy-accent text-lg font-medium">
                Battle
              </Link>
              <Link to="/search-users" className="text-white hover:text-fantasy-accent text-lg font-medium">
                <Users className="h-4 w-4 inline mr-1" /> Players
              </Link>
              <Link to="/profile" className="text-white hover:text-fantasy-accent text-lg font-medium">
                Profile
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            
            <SignedOut>
              <div className="flex flex-col space-y-2">
                <Link to="/register" className="w-full">
                  <Button className="fantasy-button w-full">
                    Register
                  </Button>
                </Link>
                <Link to="/login" className="w-full">
                  <Button className="fantasy-button-secondary w-full">
                    Login
                  </Button>
                </Link>
              </div>
            </SignedOut>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
