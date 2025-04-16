
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Routes as AppRoutes } from "./Routes";
import { AuthProvider } from "@/modules/auth/context/AuthContext";
import { AdminProvider } from "@/modules/admin/context/AdminContext";
import { ProtectedRoute } from "@/modules/auth";
import AdminAccessTrigger from "@/modules/admin/components/AdminAccessTrigger";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { MusicPlayer } from "./modules/music";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AdminProvider>
          <Toaster />
          <Sonner />
          <AdminAccessTrigger onAuthenticated={() => {}} />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-grow">
              <AppRoutes />
            </div>
            <div className="fixed bottom-4 right-4 z-50">
              <MusicPlayer />
            </div>
            <Footer />
          </div>
        </AdminProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
