
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/card-gallery" element={<CardGallery />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/battle" element={<Battle />} />
                <Route path="/visitor-demo-battle" element={<VisitorDemoBattle />} />
                <Route path="/1v1-battle" element={<OneVOneBattle />} />
                <Route path="/3-player-battle" element={<ThreePlayerBattle />} />
                <Route path="/4-player-public-battle" element={<FourPlayerPublicBattle />} />
                <Route path="/4-player-user-lobby" element={<FourPlayerUserLobby />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
