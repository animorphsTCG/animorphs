
/**
 * Utility functions for OTP verification
 */

// Validate OTP code format
export const validateOTPCode = (code: string): boolean => {
  // Check if the code is exactly 6 characters and all digits
  return /^\d{6}$/.test(code);
};

// Format the user input for consistent verification
export const formatVerificationCode = (code: string): string => {
  // Remove any whitespace and ensure we only have digits
  return code.replace(/\s+/g, '').trim();
};

// Get a user-friendly message based on an error
export const getOTPErrorMessage = (errorMessage: string): string => {
  if (!errorMessage) return "Verification failed. Please try again.";
  
  if (errorMessage.includes("expired")) {
    return "Verification code has expired. Please request a new code.";
  }
  
  if (errorMessage.includes("invalid") || errorMessage.includes("incorrect")) {
    return "Invalid verification code. Please check and try again.";
  }
  
  if (errorMessage.includes("too many")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  
  return "Verification failed. Please check your code and try again.";
};

// Calculate remaining time in human-readable format
export const formatRemainingTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
