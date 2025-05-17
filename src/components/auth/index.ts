
// This file is created for compatibility with older imports
// It re-exports everything from the new module structure
export { 
  useAuth, 
  AuthProvider,
  ProtectedRoute,
  LoginForm,
  RegistrationForm
} from '@/modules/auth';

// Export type definitions
export type { UserProfile, Session } from '@/modules/auth/types';
