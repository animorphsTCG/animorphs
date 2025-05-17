
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/modules/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield } from "lucide-react";
import useAdmin from "@/hooks/useAdmin";

const Navbar = () => {
  const { user, signOut, userProfile } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check if the user has paid - safe access
  const showMultiplayerContent = userProfile?.has_paid;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <nav className="bg-black/60 backdrop-blur-sm border-b border-white/10 py-3 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="font-fantasy text-2xl text-fantasy-accent">
          Animorphs
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => navigate("/admin")}
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              )}
              
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative rounded-full h-10 w-10 p-0">
                    <Avatar>
                      <AvatarImage src="/user-avatar.png" alt={user.email || "User"} />
                      <AvatarFallback>
                        {user.email ? user.email.substring(0, 2).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="link"
                className="text-white"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                variant="default"
                className="bg-fantasy-accent hover:bg-fantasy-accent/80"
                onClick={() => navigate("/register")}
              >
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
