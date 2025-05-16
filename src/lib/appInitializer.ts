
/**
 * App Initializer
 * Handles application bootstrapping with Cloudflare D1 and EOS
 */

import { initializeD1Database } from './cloudflare/D1Database';
import { getClientCredentialsToken } from './eos/eosAuth';
import { toast } from '@/components/ui/use-toast';

interface InitializationOptions {
  enableCache?: boolean;
  checkAuthentication?: boolean;
  silent?: boolean;
}

/**
 * Initialize the application
 * Sets up all required services and connections
 */
export const initializeApp = async (options: InitializationOptions = {}): Promise<void> => {
  try {
    if (!options.silent) {
      console.log('Initializing application...');
    }
    
    // Get client credentials token for authenticated API calls
    const token = await getClientCredentialsToken();
    
    // Initialize D1 database with the token
    initializeD1Database(token.access_token);
    
    if (!options.silent) {
      console.log('Application initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    if (!options.silent) {
      toast({
        title: "Application Error",
        description: "Failed to initialize services. Please refresh the page.",
        variant: "destructive",
      });
    }
    
    throw error;
  }
};

/**
 * Clean up resources when the application is shutting down
 */
export const cleanupApp = async (): Promise<void> => {
  // Clean up any resources or connections
  console.log('Application resources cleaned up');
};

export default initializeApp;
