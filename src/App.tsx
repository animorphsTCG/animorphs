
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
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
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ClerkAuthProvider } from "./contexts/ClerkAuthContext";
import { toast } from "@/components/ui/use-toast";
import { checkDatabaseHealth, ensureVipCodesExist } from "./lib/db";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

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
          <Route path="/1v1-battle" element={<ProtectedRoute><OneVOneBattle /></ProtectedRoute>} />
          <Route path="/3-player-battle" element={<ProtectedRoute><ThreePlayerBattle /></ProtectedRoute>} />
          <Route path="/4-player-public-battle" element={<ProtectedRoute><FourPlayerPublicBattle /></ProtectedRoute>} />
          <Route path="/4-player-user-lobby" element={<ProtectedRoute><FourPlayerUserLobby /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
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
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ClerkAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
