
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import LobbyCleanupProvider from './modules/battle/multi-player/components/LobbyCleanupProvider';
import Routes from './Routes';
import AdminShield from './modules/admin/components/AdminShield';

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
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        {/* Wrap the app with our LobbyCleanupProvider */}
        <LobbyCleanupProvider>
          <Routes />
          <Toaster />
          <AdminShield />
        </LobbyCleanupProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
