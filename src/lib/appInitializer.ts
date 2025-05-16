/**
 * App Initializer
 * Handles application bootstrapping without Supabase dependency
 */

import { d1Database } from './cloudflare/D1Database';
import { initializeD1Database } from './cloudflare/D1Database';
import { getClientCredentialsToken } from './eos/eosAuth';

interface InitializationOptions {
  enableCache?: boolean;
  checkAuthentication?: boolean;
}

/**
 * Initialize the application
 * Sets up all required services and connections
 */
export const initializeApp = async (options: InitializationOptions = {}): Promise<void> => {
  try {
    console.log('Initializing application...');
    
    // Get client credentials token for authenticated API calls
    const token = await getClientCredentialsToken();
    
    // Initialize D1 database with the token
    initializeD1Database(token.access_token);
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    throw error;
  }
};

/**
 * Clean up resources when the application is shutting down
 */
export const cleanupApp = async (): Promise<void> => {
  // Clean up any resources or connections
  // No Supabase connections to clean up anymore!
  console.log('Application resources cleaned up');
};

export default initializeApp;
