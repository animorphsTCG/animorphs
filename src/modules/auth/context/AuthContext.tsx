
import React from 'react';
import { AuthProvider as EOSAuthProvider, useAuth as useEOSAuth } from './EOSAuthContext';

/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please use EOSAuthContext.tsx instead.
 * 
 * This file re-exports the AuthProvider and useAuth from EOSAuthContext.tsx
 * to maintain compatibility with existing code.
 */

// Re-export the AuthProvider and useAuth from EOSAuthContext
export const AuthProvider = EOSAuthProvider;
export const useAuth = useEOSAuth;

// Export a dummy context that just renders children
// This is needed because some components might still be importing the AuthContext directly
const AuthContext = React.createContext<any>({});
export default AuthContext;
