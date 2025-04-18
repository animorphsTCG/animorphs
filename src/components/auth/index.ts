
// This file is created for compatibility with older imports
// It re-exports everything from the new module structure
export { useAuth, AuthProvider } from '@/modules/auth/context/AuthContext';
export { default as ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
export { default as LoginForm } from '@/modules/auth/components/LoginForm';
export { default as RegistrationForm } from '@/modules/auth/components/RegistrationForm';
export { default as PasswordReset } from '@/modules/auth/components/PasswordReset';
export { default as UpdatePassword } from '@/modules/auth/components/UpdatePassword';
