
import React from 'react';
import { useCleanupLobbies } from '../hooks/useCleanupLobbies';

interface LobbyCleanupProviderProps {
  children: React.ReactNode;
}

/**
 * A provider component that initializes the lobby cleanup system
 * and renders its children. This allows us to use the cleanup hook
 * within the React component tree.
 */
const LobbyCleanupProvider: React.FC<LobbyCleanupProviderProps> = ({ children }) => {
  // Initialize lobby cleanup (this is now inside a component, so hooks work correctly)
  useCleanupLobbies();
  
  // The provider simply renders its children
  return <>{children}</>;
};

export default LobbyCleanupProvider;
