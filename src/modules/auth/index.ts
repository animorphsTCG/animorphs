
// Export auth components and hooks
import { useAuth, AuthProvider } from './context/EOSAuthContext';
import ProtectedRoute from './components/ProtectedRoute';

export { useAuth, AuthProvider, ProtectedRoute };

// Re-export types for convenience
export type { User, Session, UserProfile } from './types';
