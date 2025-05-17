
/**
 * Auth Module Exports
 * 
 * This file exports all the auth-related components and hooks
 * to make them easily importable from other parts of the app.
 */

// Export auth providers and hooks
export { useAuth, AuthProvider } from './context/EOSAuthContext';

// Export auth components
export { default as LoginForm } from './components/LoginForm';
export { default as RegistrationForm } from './components/RegistrationForm';
export { default as PasswordReset } from './components/PasswordReset';
export { default as UpdatePassword } from './components/UpdatePassword';
export { default as ProtectedRoute } from './components/ProtectedRoute';
export { default as EpicGamesButton } from './components/EpicGamesButton';

// Re-export types for convenience
export type { User, Session, UserProfile } from './types';

