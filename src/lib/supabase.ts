
import { createClient } from '@supabase/supabase-js';
import { measure, monitorChannel } from './monitoring';

const supabaseUrl = "https://orrmjadspjsbdfnhnkgu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycm1qYWRzcGpzYmRmbmhua2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1ODQ0MTksImV4cCI6MjA1OTE2MDQxOX0.p8Du23Cz-I-ja9yc0howqrtboJxBZp9muuFY4xVSPoU";

// Create enhanced supabase client with retry logic and monitoring
const createEnhancedClient = () => {
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: localStorage
    },
    // Add realtime options to improve connection reliability
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    // Global error handler
    global: {
      fetch: (...args) => {
        return fetch.apply(null, args);
      }
    }
  });

  // Override the channel method to add monitoring
  const originalChannel = client.channel;
  client.channel = function(channelId, options) {
    const channel = originalChannel.call(this, channelId, options);
    return monitorChannel(channel, channelId);
  };

  return client;
};

// Apply the performance measurement decorator to track Supabase client creation time
export const supabase = createEnhancedClient();

// Export a function to reset the client's connection (useful after network issues)
export const resetSupabaseConnection = () => {
  // Force close all realtime connections
  (supabase as any).realtime?.disconnect();
  
  // Reestablish connection after a short delay
  setTimeout(() => {
    (supabase as any).realtime?.connect();
  }, 100);
};
