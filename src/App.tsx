
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import Layout from './components/Layout';

// Page imports
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Music from './pages/Music';
import Battle from './pages/Battle';
import Multiplayer from './pages/Multiplayer';
import About from './pages/About';

// Battle mode components
import OneVOneBattle from './modules/battle/single-player/one-v-one/OneVOneBattle';
import {
  MultiplayerBattle,
  ThreePlayerBattle,
  FourPlayerPublicBattle,
  FourPlayerUserBattle,
  WaitingRoom
} from './modules/battle/multi-player';
import DeckBuilder from './pages/DeckBuilder';
import { useCleanupLobbies } from './modules/battle/multi-player/hooks';

// Create a React Query client with default settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function App() {
  // Initialize the lobby cleanup system
  useCleanupLobbies();
  
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/music" element={<Music />} />
            <Route path="/battle" element={<Battle />} />
            <Route path="/multiplayer" element={<Multiplayer />} />
            <Route path="/battle/one-v-one" element={<OneVOneBattle />} />
            <Route path="/battle/multiplayer/:battleId" element={<MultiplayerBattle />} />
            <Route path="/3-player-battle/:battleId" element={<ThreePlayerBattle />} />
            <Route path="/4-player-public/:battleId" element={<FourPlayerPublicBattle />} />
            <Route path="/4-player-user-lobby/:battleId" element={<FourPlayerUserBattle />} />
            <Route path="/battle-lobby/:lobbyId" element={<WaitingRoom lobbyId="" />} />
            <Route path="/deck-builder" element={<DeckBuilder />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Layout>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
