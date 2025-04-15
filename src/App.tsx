import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import Index from "./pages/Index";
import CardGallery from "./pages/CardGallery";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Verify from "./pages/Verify";
import TermsAndConditions from "./pages/TermsAndConditions";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import Battle from "./pages/Battle";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import OneVOneBattle from "./pages/OneVOneBattle";
import VisitorDemoBattle from "./pages/VisitorDemoBattle";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { supabase } from "@/lib/supabase";

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
const ProtectedRouteComponent = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };

    checkAuth();
    
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);
  
  if (isAuthenticated === null) {
    // Still loading auth state
    return <div className="flex justify-center items-center h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent" />
    </div>;
  }
  
  // The actual protection happens in each component with useEffect + useAuth
  // This is just a wrapper for organizational purposes
  return <>{children}</>;
};

const AppContent = () => {
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
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancelled" element={<PaymentCancelled />} />
          <Route 
            path="/battle" 
            element={
              <ProtectedRoute>
                <Battle />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/1v1-battle" 
            element={
              <ProtectedRoute>
                <OneVOneBattle />
              </ProtectedRoute>
            } 
          />
          <Route path="/visitor-demo-battle" element={<VisitorDemoBattle />} />
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
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
