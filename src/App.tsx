
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import CardGallery from "./pages/CardGallery";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Verify from "./pages/Verify";
import Battle from "./pages/Battle";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import VisitorDemoBattle from "./pages/VisitorDemoBattle";
import OneVOneBattle from "./pages/OneVOneBattle";
import ThreePlayerBattle from "./pages/ThreePlayerBattle";
import FourPlayerPublicBattle from "./pages/FourPlayerPublicBattle";
import FourPlayerUserLobby from "./pages/FourPlayerUserLobby";
import Leaderboard from "./pages/Leaderboard";
import UserProfile from "./pages/UserProfile";
import UserSearch from "./pages/UserSearch";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ClerkAuthProvider } from "./contexts/ClerkAuthContext";
import { toast } from "@/components/ui/use-toast";
import { checkDatabaseHealth, ensureVipCodesExist } from "./lib/db";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="flex items-center justify-center min-h-screen flex-col gap-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="mb-4">Please log in to access this page</p>
            <div className="flex justify-center">
              <a href="/login" className="fantasy-button px-4 py-2 rounded">
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  );
};

const PaidAccessRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [hasChecked, setHasChecked] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  
  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/login");
          return;
        }
        
        const { data, error } = await supabase
          .from('payment_status')
          .select('has_paid')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error checking payment status:", error);
          navigate("/profile");
          return;
        }
        
        if (!data.has_paid) {
          toast({
            title: "Payment Required",
            description: "Please unlock all battle modes with a one-time payment",
            variant: "destructive"
          });
          navigate("/profile");
          return;
        }
        
        setHasPaid(true);
      } catch (err) {
        console.error("Error in payment check:", err);
        navigate("/profile");
      } finally {
        setHasChecked(true);
      }
    };
    
    checkPaymentStatus();
  }, [navigate]);
  
  if (!hasChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent" />
      </div>
    );
  }
  
  return (
    <>
      <SignedIn>
        {hasPaid ? children : (
          <div className="flex items-center justify-center min-h-screen flex-col gap-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Payment Required</h2>
              <p className="mb-4">You need to unlock battle modes before accessing this feature</p>
              <div className="flex justify-center">
                <a href="/profile" className="fantasy-button px-4 py-2 rounded">
                  Go to Profile
                </a>
              </div>
            </div>
          </div>
        )}
      </SignedIn>
      <SignedOut>
        <div className="flex items-center justify-center min-h-screen flex-col gap-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="mb-4">Please log in to access this page</p>
            <div className="flex justify-center">
              <a href="/login" className="fantasy-button px-4 py-2 rounded">
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  );
};

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const isHealthy = await checkDatabaseHealth();
        if (!isHealthy) {
          console.error("Database health check failed");
        }
        
        await ensureVipCodesExist();
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };
    
    initializeApp();
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/card-gallery" element={<CardGallery />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/battle" element={<ProtectedRoute><Battle /></ProtectedRoute>} />
          <Route path="/visitor-demo-battle" element={<VisitorDemoBattle />} />
          <Route path="/1v1-battle" element={<PaidAccessRoute><OneVOneBattle /></PaidAccessRoute>} />
          <Route path="/3-player-battle" element={<PaidAccessRoute><ThreePlayerBattle /></PaidAccessRoute>} />
          <Route path="/4-player-public-battle" element={<PaidAccessRoute><FourPlayerPublicBattle /></PaidAccessRoute>} />
          <Route path="/4-player-user-lobby" element={<PaidAccessRoute><FourPlayerUserLobby /></PaidAccessRoute>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/search-users" element={<ProtectedRoute><UserSearch /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ClerkAuthProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </ClerkAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
