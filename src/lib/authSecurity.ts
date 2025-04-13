import { supabase } from "@/lib/supabase";

interface AuthAttempt {
  timestamp: number;
  success: boolean;
}

// Track login attempts in memory
const loginAttempts = new Map<string, AuthAttempt[]>();

// Security configuration
const securityConfig = {
  maxFailedAttempts: 5,          // Maximum failed attempts before lockout
  lockoutDuration: 15 * 60 * 1000, // 15 minutes lockout duration
  attemptWindow: 30 * 60 * 1000, // Window for tracking attempts (30 min)
  cleanupInterval: 60 * 60 * 1000 // Cleanup old entries every hour
};

// Set up cleanup interval
setInterval(() => {
  const cutoff = Date.now() - securityConfig.attemptWindow;
  
  // Cleanup old entries
  loginAttempts.forEach((attempts, key) => {
    const validAttempts = attempts.filter(a => a.timestamp >= cutoff);
    
    if (validAttempts.length === 0) {
      loginAttempts.delete(key);
    } else if (validAttempts.length !== attempts.length) {
      loginAttempts.set(key, validAttempts);
    }
  });
}, securityConfig.cleanupInterval);

/**
 * Record an authentication attempt
 * @param identifier Email or username used for login
 * @param success Whether the attempt was successful
 */
export function recordAuthAttempt(identifier: string, success: boolean): void {
  if (!identifier) return;
  
  const normalizedIdentifier = identifier.toLowerCase();
  const currentAttempts = loginAttempts.get(normalizedIdentifier) || [];
  
  // Add new attempt
  currentAttempts.push({
    timestamp: Date.now(),
    success
  });
  
  // Only keep attempts within the window
  const cutoff = Date.now() - securityConfig.attemptWindow;
  const validAttempts = currentAttempts.filter(a => a.timestamp >= cutoff);
  
  loginAttempts.set(normalizedIdentifier, validAttempts);
  
  // If successful login, we can optionally clear the record
  // This is a decision point - do we want to reset on success?
  if (success) {
    loginAttempts.set(normalizedIdentifier, []);
  }
}

/**
 * Check if an account is locked out
 * @param identifier Email or username to check
 * @returns Whether the account is currently locked out
 */
export function isAccountLocked(identifier: string): boolean {
  if (!identifier) return false;
  
  const normalizedIdentifier = identifier.toLowerCase();
  const attempts = loginAttempts.get(normalizedIdentifier);
  
  // No attempts recorded
  if (!attempts || attempts.length === 0) return false;
  
  // Check lockout status
  const recentAttempts = attempts.filter(a => 
    !a.success && 
    (Date.now() - a.timestamp) < securityConfig.lockoutDuration
  );
  
  // Check if we've had too many failed attempts
  if (recentAttempts.length >= securityConfig.maxFailedAttempts) {
    // Find most recent failed attempt
    const mostRecentAttempt = Math.max(...recentAttempts.map(a => a.timestamp));
    const lockedUntil = mostRecentAttempt + securityConfig.lockoutDuration;
    
    // If lockout period has passed, account is not locked
    if (Date.now() > lockedUntil) return false;
    
    return true;
  }
  
  return false;
}

/**
 * Get time remaining in lockout in seconds
 * @param identifier Email or username to check
 * @returns Seconds remaining in lockout or 0 if not locked
 */
export function getLockoutTimeRemaining(identifier: string): number {
  if (!identifier) return 0;
  
  const normalizedIdentifier = identifier.toLowerCase();
  const attempts = loginAttempts.get(normalizedIdentifier);
  
  // No attempts recorded
  if (!attempts || attempts.length === 0) return 0;
  
  // Get failed attempts within lockout window
  const recentAttempts = attempts.filter(a => 
    !a.success && 
    (Date.now() - a.timestamp) < securityConfig.lockoutDuration
  );
  
  // Check if we've had too many failed attempts
  if (recentAttempts.length >= securityConfig.maxFailedAttempts) {
    // Find most recent failed attempt
    const mostRecentAttempt = Math.max(...recentAttempts.map(a => a.timestamp));
    const lockedUntil = mostRecentAttempt + securityConfig.lockoutDuration;
    
    // If still in lockout period, return remaining time
    if (Date.now() < lockedUntil) {
      return Math.ceil((lockedUntil - Date.now()) / 1000);
    }
  }
  
  return 0;
}

/**
 * Manually unlock an account
 * @param identifier Email or username to unlock
 */
export function unlockAccount(identifier: string): void {
  if (!identifier) return;
  
  const normalizedIdentifier = identifier.toLowerCase();
  loginAttempts.delete(normalizedIdentifier);
}

/**
 * Get login attempts statistics
 */
export function getLoginStats(): Record<string, any> {
  const stats = {
    totalTrackedAccounts: loginAttempts.size,
    lockedAccounts: 0,
    recentFailedAttempts: 0,
    recentSuccessfulAttempts: 0
  };
  
  // Last hour stats
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  
  loginAttempts.forEach((attempts, identifier) => {
    if (isAccountLocked(identifier)) {
      stats.lockedAccounts++;
    }
    
    attempts.forEach(attempt => {
      if (attempt.timestamp >= oneHourAgo) {
        if (attempt.success) {
          stats.recentSuccessfulAttempts++;
        } else {
          stats.recentFailedAttempts++;
        }
      }
    });
  });
  
  return stats;
}
