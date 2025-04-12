
/**
 * Validation utilities for form inputs
 */

// Username validation
export function validateUsername(username: string): { valid: boolean; message?: string } {
  if (!username || username.trim() === '') {
    return { valid: false, message: 'Username is required' };
  }
  
  if (username.length < 3 || username.length > 30) {
    return { valid: false, message: 'Username must be between 3 and 30 characters' };
  }
  
  // Allow only letters, numbers, underscores, and hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, underscores and hyphens' };
  }
  
  return { valid: true };
}

// Email validation with strong regex for RFC 5322 standard
export function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email || email.trim() === '') {
    return { valid: false, message: 'Email is required' };
  }
  
  // RFC 5322 compliant email regex
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  
  // Check for disposable email providers
  const disposableDomains = [
    'mailinator.com', 'tempmail.com', 'throwawaymail.com', 'guerrillamail.com',
    'trashmail.com', '10minutemail.com', 'yopmail.com', 'dispostable.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && disposableDomains.includes(domain)) {
    return { valid: false, message: 'Please use a non-disposable email address' };
  }
  
  return { valid: true };
}

// Password validation - enforcing stronger requirements
export function validatePassword(password: string): { valid: boolean; message?: string; strength?: string } {
  if (!password || password === '') {
    return { valid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters', strength: 'weak' };
  }
  
  let strength = 0;
  
  // Add points for length
  if (password.length >= 12) strength += 1;
  if (password.length >= 16) strength += 1;
  
  // Add points for character variety
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  
  // Check for common password patterns
  const commonPatterns = [
    'password', '123456', 'qwerty', 'admin', 'welcome',
    'letmein', 'abc123', 'monkey', 'football'
  ];
  
  const lowercasePassword = password.toLowerCase();
  
  // Check if password contains common patterns
  if (commonPatterns.some(pattern => lowercasePassword.includes(pattern))) {
    strength -= 2;
  }
  
  // Check for sequential characters
  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/.test(lowercasePassword)) {
    strength -= 1;
  }
  
  // Check for sequential numbers
  if (/123|234|345|456|567|678|789|987|876|765|654|543|432|321/.test(password)) {
    strength -= 1;
  }
  
  // Set minimum requirements
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter', strength: 'weak' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number', strength: 'weak' };
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character', strength: 'medium' };
  }
  
  // Determine password strength
  let strengthLabel = 'medium';
  if (strength >= 5) strengthLabel = 'strong';
  if (strength <= 2) strengthLabel = 'weak';
  
  return { valid: true, strength: strengthLabel };
}

// Age validation
export function validateAge(age: number | string): { valid: boolean; message?: string } {
  const ageNumber = typeof age === 'string' ? parseInt(age, 10) : age;
  
  if (isNaN(ageNumber)) {
    return { valid: false, message: 'Age must be a number' };
  }
  
  if (ageNumber < 13) {
    return { valid: false, message: 'You must be at least 13 years old to register' };
  }
  
  if (ageNumber > 120) {
    return { valid: false, message: 'Please enter a valid age' };
  }
  
  return { valid: true };
}

// Name validation
export function validateName(name: string): { valid: boolean; message?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, message: 'Name is required' };
  }
  
  if (name.length < 2 || name.length > 50) {
    return { valid: false, message: 'Name must be between 2 and 50 characters' };
  }
  
  // Allow letters, spaces, hyphens, and apostrophes (for names like O'Connor or Smith-Jones)
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return { valid: false, message: 'Name contains invalid characters' };
  }
  
  return { valid: true };
}

// VIP code validation
export function validateVipCode(code: string): { valid: boolean; message?: string } {
  // VIP code is optional
  if (!code || code.trim() === '') {
    return { valid: true };
  }
  
  if (code.length < 3 || code.length > 30) {
    return { valid: false, message: 'VIP code must be between 3 and 30 characters' };
  }
  
  // Only allow letters, numbers, underscores, and hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
    return { valid: false, message: 'VIP code contains invalid characters' };
  }
  
  return { valid: true };
}
