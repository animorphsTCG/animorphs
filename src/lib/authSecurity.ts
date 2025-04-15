import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface AuthAttempt {
  timestamp: number;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

// Track login attempts in memory with more details
const loginAttempts = new Map<string, AuthAttempt[]>();

// Security configuration
const securityConfig = {
  maxFailedAttempts: 5,          // Maximum failed attempts before lockout
  lockoutDuration: 15 * 60 * 1000, // 15 minutes lockout duration
  attemptWindow: 30 * 60 * 1000, // Window for tracking attempts (30 min)
  cleanupInterval: 60 * 60 * 1000, // Cleanup old entries every hour
  progressiveBackoff: true       // Enable progressive backoff for repeated failures
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
 * Record an authentication attempt with enhanced information
 * @param identifier Email or username used for login
 * @param success Whether the attempt was successful
 * @param metadata Additional information about the login attempt
 */
export function recordAuthAttempt(
  identifier: string, 
  success: boolean, 
  metadata: { ipAddress?: string; userAgent?: string } = {}
): void {
  if (!identifier) return;
  
  const normalizedIdentifier = identifier.toLowerCase();
  const currentAttempts = loginAttempts.get(normalizedIdentifier) || [];
  
  // Add new attempt with metadata
  currentAttempts.push({
    timestamp: Date.now(),
    success,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent
  });
  
  // Only keep attempts within the window
  const cutoff = Date.now() - securityConfig.attemptWindow;
  const validAttempts = currentAttempts.filter(a => a.timestamp >= cutoff);
  
  loginAttempts.set(normalizedIdentifier, validAttempts);
  
  // If successful login, reset failed attempts
  if (success) {
    const successfulAttempt = validAttempts[validAttempts.length - 1];
    loginAttempts.set(normalizedIdentifier, [successfulAttempt]);
    
    // Log the successful login
    console.log(`Successful login for ${normalizedIdentifier}`);
  } else {
    // Calculate failed attempts
    const recentFailedAttempts = validAttempts.filter(a => !a.success);
    
    if (recentFailedAttempts.length >= securityConfig.maxFailedAttempts) {
      // Calculate lockout time based on progressive backoff
      const lockoutMultiplier = securityConfig.progressiveBackoff ? 
        Math.min(recentFailedAttempts.length - securityConfig.maxFailedAttempts + 1, 5) : 
        1;
      
      const lockoutTime = Math.floor((securityConfig.lockoutDuration * lockoutMultiplier) / 1000 / 60);
      console.warn(`Account ${normalizedIdentifier} locked for ${lockoutTime} minutes after ${recentFailedAttempts.length} failed attempts`);
      
      // You could also add actual logging to a security log table in your database here
    }
  }
}

/**
 * Check if an account is locked out with progressive backoff
 * @param identifier Email or username to check
 * @returns Whether the account is currently locked out
 */
export function isAccountLocked(identifier: string): boolean {
  if (!identifier) return false;
  
  const normalizedIdentifier = identifier.toLowerCase();
  const attempts = loginAttempts.get(normalizedIdentifier);
  
  // No attempts recorded
  if (!attempts || attempts.length === 0) return false;
  
  // Check failed attempts
  const recentFailedAttempts = attempts.filter(a => !a.success);
  
  // Check if we've had too many failed attempts
  if (recentFailedAttempts.length >= securityConfig.maxFailedAttempts) {
    // Find most recent failed attempt
    const mostRecentAttempt = Math.max(...recentFailedAttempts.map(a => a.timestamp));
    
    // Calculate lockout duration based on number of failed attempts (progressive backoff)
    const lockoutMultiplier = securityConfig.progressiveBackoff ? 
      Math.min(recentFailedAttempts.length - securityConfig.maxFailedAttempts + 1, 5) : 
      1;
    
    const lockoutDuration = securityConfig.lockoutDuration * lockoutMultiplier;
    const lockedUntil = mostRecentAttempt + lockoutDuration;
    
    // If lockout period has passed, account is not locked
    if (Date.now() > lockedUntil) return false;
    
    return true;
  }
  
  return false;
}

/**
 * Get time remaining in lockout in seconds with progressive backoff
 * @param identifier Email or username to check
 * @returns Seconds remaining in lockout or 0 if not locked
 */
export function getLockoutTimeRemaining(identifier: string): number {
  if (!identifier) return 0;
  
  const normalizedIdentifier = identifier.toLowerCase();
  const attempts = loginAttempts.get(normalizedIdentifier);
  
  // No attempts recorded
  if (!attempts || attempts.length === 0) return 0;
  
  // Get failed attempts
  const recentFailedAttempts = attempts.filter(a => !a.success);
  
  // Check if we've had too many failed attempts
  if (recentFailedAttempts.length >= securityConfig.maxFailedAttempts) {
    // Find most recent failed attempt
    const mostRecentAttempt = Math.max(...recentFailedAttempts.map(a => a.timestamp));
    
    // Calculate lockout duration based on number of failed attempts (progressive backoff)
    const lockoutMultiplier = securityConfig.progressiveBackoff ? 
      Math.min(recentFailedAttempts.length - securityConfig.maxFailedAttempts + 1, 5) : 
      1;
    
    const lockoutDuration = securityConfig.lockoutDuration * lockoutMultiplier;
    const lockedUntil = mostRecentAttempt + lockoutDuration;
    
    // If still in lockout period, return remaining time
    if (Date.now() < lockedUntil) {
      return Math.ceil((lockedUntil - Date.now()) / 1000);
    }
  }
  
  return 0;
}

/**
 * Get friendly lockout message for display
 * @param identifier Email or username to check
 * @returns A user-friendly message about the lockout status
 */
export function getLockoutMessage(identifier: string): string {
  const remainingSeconds = getLockoutTimeRemaining(identifier);
  
  if (remainingSeconds <= 0) {
    return '';
  }
  
  // Format time nicely
  if (remainingSeconds < 60) {
    return `Too many failed attempts. Please try again in ${remainingSeconds} seconds.`;
  } else if (remainingSeconds < 3600) {
    const minutes = Math.ceil(remainingSeconds / 60);
    return `Too many failed attempts. Your account is temporarily locked. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
  } else {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.ceil((remainingSeconds % 3600) / 60);
    return `Too many failed attempts. Your account is temporarily locked. Please try again in ${hours} hour${hours === 1 ? '' : 's'} and ${minutes} minute${minutes === 1 ? '' : 's'}.`;
  }
}

/**
 * Attempt to login with security checks
 * @param email User email
 * @param password User password
 * @returns Success status and message/error
 */
export async function secureLogin(email: string, password: string): Promise<{success: boolean; message?: string; data?: any}> {
  try {
    if (isAccountLocked(email)) {
      const message = getLockoutMessage(email);
      return { 
        success: false,
        message
      };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      // Record failed attempt
      recordAuthAttempt(email, false);
      
      // Check if account is now locked after this attempt
      if (isAccountLocked(email)) {
        return { 
          success: false, 
          message: getLockoutMessage(email)
        };
      }
      
      return { 
        success: false, 
        message: error.message
      };
    }
    
    // Record successful attempt
    recordAuthAttempt(email, true);
    
    return { 
      success: true, 
      data
    };
    
  } catch (error: any) {
    // Record failed attempt
    recordAuthAttempt(email, false);
    
    return { 
      success: false, 
      message: error.message || 'An unexpected error occurred'
    };
  }
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
