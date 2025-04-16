
import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/modules/auth';

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
import OneVOneBattle from "./pages/OneVOneBattle";
import VisitorDemoBattle from "./pages/VisitorDemoBattle";
import Admin from "./pages/Admin";

export const Routes = () => {
  return (
    <RouterRoutes>
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
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};
