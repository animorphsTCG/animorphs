
import { Routes as RouterRoutes, Route, Navigate, Outlet } from 'react-router-dom';

import Layout from '@/components/Layout';
import { ProtectedRoute } from '@/modules/auth';

import Home from '@/pages/Home';
import About from '@/pages/About';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ResetPassword from '@/pages/ResetPassword';
import UpdatePassword from '@/pages/UpdatePassword';
import Profile from '@/pages/Profile';
import PublicProfile from '@/pages/PublicProfile';
import Battle from '@/pages/Battle';
import VisitorDemoBattle from '@/pages/VisitorDemoBattle';
import DeckBuilder from '@/pages/DeckBuilder';
import CardGallery from '@/pages/CardGallery';
import Leaderboard from '@/pages/Leaderboard';
import Music from '@/pages/Music';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';
import Index from '@/pages/Index';
import UserProfile from '@/pages/UserProfile';
import UserSearch from '@/pages/UserSearch';
import Verify from '@/pages/Verify';
import PaymentSuccess from '@/pages/PaymentSuccess';
import PaymentCancelled from '@/pages/PaymentCancelled';
import TermsAndConditions from '@/pages/TermsAndConditions';
import OneVOneBattle from '@/pages/OneVOneBattle';
import ThreePlayerBattle from '@/pages/ThreePlayerBattle';
import FourPlayerPublicBattle from '@/pages/FourPlayerPublicBattle';
import FourPlayerUserLobby from '@/pages/FourPlayerUserLobby';
import Multiplayer from '@/pages/Multiplayer';
import AuthCallback from '@/pages/AuthCallback';

const Routes = () => {
  return (
    <RouterRoutes>
      {/* Public Routes */}
      <Route element={<Layout><Outlet /></Layout>}>
        <Route index element={<Index />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="update-password" element={<UpdatePassword />} />
        <Route path="visitor-demo-battle" element={<VisitorDemoBattle />} />
        <Route path="public-profile/:id" element={<PublicProfile />} />
        <Route path="verify" element={<Verify />} />
        <Route path="payment-success" element={<PaymentSuccess />} />
        <Route path="payment-cancelled" element={<PaymentCancelled />} />
        <Route path="terms-and-conditions" element={<TermsAndConditions />} />
        
        {/* Auth Callback for Epic Games OAuth */}
        <Route path="auth/callback" element={<AuthCallback />} />
        
        {/* Protected Routes */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile/:id"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="battle"
          element={
            <ProtectedRoute>
              <Battle />
            </ProtectedRoute>
          }
        />
        <Route
          path="deck-builder"
          element={
            <ProtectedRoute>
              <DeckBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="card-gallery"
          element={
            <ProtectedRoute>
              <CardGallery />
            </ProtectedRoute>
          }
        />
        <Route
          path="leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="music"
          element={
            <ProtectedRoute>
              <Music />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute>
              <UserSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="one-v-one-battle"
          element={
            <ProtectedRoute>
              <OneVOneBattle />
            </ProtectedRoute>
          }
        />
        <Route
          path="three-player-battle"
          element={
            <ProtectedRoute>
              <ThreePlayerBattle />
            </ProtectedRoute>
          }
        />
        <Route
          path="four-player-public-battle"
          element={
            <ProtectedRoute>
              <FourPlayerPublicBattle />
            </ProtectedRoute>
          }
        />
        <Route
          path="four-player-user-lobby"
          element={
            <ProtectedRoute>
              <FourPlayerUserLobby />
            </ProtectedRoute>
          }
        />
        <Route
          path="multiplayer"
          element={
            <ProtectedRoute>
              <Multiplayer />
            </ProtectedRoute>
          }
        />
        
        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </RouterRoutes>
  );
};

export default Routes;
