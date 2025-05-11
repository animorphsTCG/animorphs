
/**
 * Epic Online Services (EOS) Integration
 * Main entry point for EOS functionality
 */

// Re-export auth functionality
export * from './eosAuth';
export * from './eosPresence';

// Initialize the EOS SDK (if needed for voice chat or other features)
// This would typically be done when the app starts
export const initializeEOSSDK = (): void => {
  // This is a stub for now - would initialize the EOS SDK if needed
  console.log('EOS SDK initialized');
};
