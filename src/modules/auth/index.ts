
// Export auth components and hooks
export { useAuth, AuthProvider } from './context/EOSAuthContext';
export { default as ProtectedRoute } from './components/ProtectedRoute';

// Re-export types for convenience
export type { User, Session } from './types';
