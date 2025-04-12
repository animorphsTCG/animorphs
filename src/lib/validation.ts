
// Add or update the validation functions to ensure they return the proper interface

interface ValidationResult {
  valid: boolean;
  message?: string;
  strength?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return { valid: false, message: "Email is required" };
  }
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Invalid email format" };
  }
  return { valid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { valid: false, message: "Password is required", strength: "weak" };
  }
  
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters", strength: "weak" };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const passedChecks = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;
  
  if (passedChecks <= 1) {
    return { 
      valid: false, 
      message: "Password is too weak. Add uppercase letters, numbers, or special characters.",
      strength: "weak"
    };
  } else if (passedChecks === 2) {
    return { valid: true, strength: "medium" };
  } else if (passedChecks === 3) {
    return { valid: true, strength: "strong" };
  } else {
    return { valid: true, strength: "strong" };
  }
};

export const validateUsername = (username: string): ValidationResult => {
  if (!username) {
    return { valid: false, message: "Username is required" };
  }
  
  if (username.length < 3) {
    return { valid: false, message: "Username must be at least 3 characters" };
  }
  
  if (username.length > 30) {
    return { valid: false, message: "Username must be less than 30 characters" };
  }
  
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return { valid: false, message: "Username can only contain letters, numbers, and _.-" };
  }
  
  return { valid: true };
};

export const validateName = (name: string): ValidationResult => {
  if (!name) {
    return { valid: false, message: "Name is required" };
  }
  
  if (name.length < 2) {
    return { valid: false, message: "Name must be at least 2 characters" };
  }
  
  return { valid: true };
};

export const validateAge = (age: string): ValidationResult => {
  const ageNum = parseInt(age);
  
  if (!age) {
    return { valid: false, message: "Age is required" };
  }
  
  if (isNaN(ageNum)) {
    return { valid: false, message: "Age must be a number" };
  }
  
  if (ageNum < 13) {
    return { valid: false, message: "You must be at least 13 years old" };
  }
  
  if (ageNum > 120) {
    return { valid: false, message: "Please enter a valid age" };
  }
  
  return { valid: true };
};
