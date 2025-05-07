import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/modules/auth'; // Using the correct import
import { DemoBattle, OneVOneBattle } from '@/modules/battle/single-player';
import { MultiplayerBattle, ThreePlayerBattle, FourPlayerPublicBattle, FourPlayerUserBattle } from '@/modules/battle/multi-player';

// Pages
import Index from "./pages/Index";
import CardGallery from "./pages/CardGallery";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Verify from "./pages/Verify";
import TermsAndConditions from "./pages/TermsAndConditions";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import Battle from "./pages/Battle";
import Multiplayer from "./pages/Multiplayer";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import PublicProfile from './pages/PublicProfile';
import ThreePlayerBattlePage from './pages/ThreePlayerBattle';

export const Routes = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<Index />} />
      <Route path="/card-gallery" element={<CardGallery />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
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
        path="/multiplayer" 
        element={
          <ProtectedRoute>
            <Multiplayer />
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
      <Route path="/visitor-demo-battle" element={<DemoBattle />} />
      <Route path="/admin" element={<Admin />} />
      
      <Route path="/profile/:userId" element={<PublicProfile />} />
      
      <Route 
        path="/battle/multiplayer/:battleId" 
        element={
          <ProtectedRoute>
            <MultiplayerBattle />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/3-player-battle/:battleId" 
        element={
          <ProtectedRoute>
            <ThreePlayerBattle />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/3-player-battle" 
        element={
          <ProtectedRoute>
            <ThreePlayerBattlePage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/4-player-public-battle/:battleId" 
        element={
          <ProtectedRoute>
            <FourPlayerPublicBattle />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/4-player-public-battle" 
        element={
          <ProtectedRoute>
            <FourPlayerPublicBattle />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/4-player-user-lobby/:battleId" 
        element={
          <ProtectedRoute>
            <FourPlayerUserBattle />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/4-player-user-lobby" 
        element={
          <ProtectedRoute>
            <FourPlayerUserBattle />
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};
