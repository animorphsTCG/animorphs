
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
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { checkDatabaseHealth, ensureVipCodesExist } from "./lib/db";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !session && !location.pathname.includes("/login") && !location.pathname.includes("/register")) {
      console.log("User not authenticated, redirecting to login");
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page",
      });
      navigate("/login");
    }
  }, [user, session, isLoading, navigate, location.pathname]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-fantasy-primary"></div>
    </div>;
  }

  return <>{children}</>;
};

// Main app component
const AppContent = () => {
  const { session, user } = useAuth(); // Add session here
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check database health
        const isHealthy = await checkDatabaseHealth();
        if (!isHealthy) {
          console.error("Database health check failed");
        }
        
        // Ensure VIP codes exist
        await ensureVipCodesExist();
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };
    
    initializeApp();
  }, []);
  
  // Redirect logged in users to battle page if they're on login or register page
  useEffect(() => {
    if (session && (location.pathname === "/login" || location.pathname === "/register")) {
      console.log("User already authenticated, redirecting from auth page to battle");
      navigate("/battle");
    }
  }, [session, location.pathname, navigate]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/card-gallery" element={<CardGallery />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
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
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
