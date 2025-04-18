
import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/modules/auth';
import { DemoBattle, OneVOneBattle } from '@/modules/battle/single-player';

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
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import PublicProfile from './pages/PublicProfile';
import ThreePlayerBattle from './pages/ThreePlayerBattle';

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
      
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};
