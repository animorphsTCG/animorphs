
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Users, LogOut, UserCircle, Gamepad, Swords, Shield } from "lucide-react";
import { useAuth } from "@/modules/auth/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userProfile, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleProfileClick = (route: string) => {
    navigate(route);
    setIsMenuOpen(false);
  };

  // Check if the user has paid to determine if multiplayer link should be shown
  const showMultiplayerLink = user && userProfile?.has_paid === true;

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
            
            <Link to="/visitor-demo-battle" className="text-white hover:text-fantasy-accent transition-colors font-medium">
              Demo Battle
            </Link>
            
            {user && (
              <Link to="/battle" className="text-white hover:text-fantasy-accent transition-colors font-medium">
                Battle
              </Link>
            )}

            {showMultiplayerLink && (
              <Link to="/multiplayer" className="text-white hover:text-fantasy-accent transition-colors font-medium flex items-center">
                <Swords className="mr-1 h-4 w-4" /> Multiplayer
              </Link>
            )}
            
            {!isLoading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <User className="h-4 w-4 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Profile Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleProfileClick('/profile')}>
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Edit Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleProfileClick(`/profile/${user.id}`)}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Public Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link to="/register">
                      <Button className="fantasy-button">Register</Button>
                    </Link>
                    <Link to="/login">
                      <Button className="fantasy-button-secondary">Login</Button>
                    </Link>
                  </div>
                )}
              </>
            )}
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
            <Link to="/" className="text-white hover:text-fantasy-accent text-lg font-medium" onClick={toggleMenu}>
              Home
            </Link>
            <Link to="/card-gallery" className="text-white hover:text-fantasy-accent text-lg font-medium" onClick={toggleMenu}>
              Cards
            </Link>
            
            <Link to="/visitor-demo-battle" className="text-white hover:text-fantasy-accent text-lg font-medium flex items-center" onClick={toggleMenu}>
              <Gamepad className="mr-2 h-4 w-4" /> Demo Battle
            </Link>

            {user && (
              <Link to="/battle" className="text-white hover:text-fantasy-accent text-lg font-medium flex items-center" onClick={toggleMenu}>
                <Gamepad className="mr-2 h-4 w-4" /> Battle
              </Link>
            )}

            {showMultiplayerLink && (
              <Link to="/multiplayer" className="text-white hover:text-fantasy-accent text-lg font-medium flex items-center" onClick={toggleMenu}>
                <Swords className="mr-2 h-4 w-4" /> Multiplayer
              </Link>
            )}
            
            <Link to="/terms-and-conditions" className="text-white hover:text-fantasy-accent text-lg font-medium flex items-center" onClick={toggleMenu}>
              <Shield className="mr-2 h-4 w-4" /> Terms & Conditions
            </Link>
            
            <Link to="/privacy-policy" className="text-white hover:text-fantasy-accent text-lg font-medium flex items-center" onClick={toggleMenu}>
              <Shield className="mr-2 h-4 w-4" /> Privacy Policy
            </Link>
            
            {user && (
              <>
                <div 
                  onClick={() => handleProfileClick('/profile')} 
                  className="text-white hover:text-fantasy-accent text-lg font-medium cursor-pointer flex items-center"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  Edit Profile
                </div>
                <div 
                  onClick={() => handleProfileClick(`/profile/${user.id}`)} 
                  className="text-white hover:text-fantasy-accent text-lg font-medium cursor-pointer flex items-center"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Public Profile
                </div>
                <div 
                  onClick={() => signOut()} 
                  className="text-white hover:text-fantasy-accent text-lg font-medium cursor-pointer flex items-center"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </div>
              </>
            )}
            
            {!user && !isLoading && (
              <div className="flex flex-col space-y-2">
                <Link to="/register" className="w-full" onClick={toggleMenu}>
                  <Button className="fantasy-button w-full">
                    Register
                  </Button>
                </Link>
                <Link to="/login" className="w-full" onClick={toggleMenu}>
                  <Button className="fantasy-button-secondary w-full">
                    Login
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
