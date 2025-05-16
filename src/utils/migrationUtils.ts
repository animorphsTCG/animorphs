
/**
 * Migration Utilities
 * 
 * Helper functions to track progress of the Supabase to D1/EOS migration
 */

import { toast } from '@/components/ui/use-toast';

// Component migration statuses
interface MigrationItem {
  file: string;
  status: 'pending' | 'in-progress' | 'completed';
  dependencies: string[];
}

// List of components that need to be migrated
const componentMigrations: MigrationItem[] = [
  { file: 'src/components/MusicSettings.tsx', status: 'in-progress', dependencies: ['useD1Database', 'd1Worker'] },
  { file: 'src/components/music/SettingsControls.tsx', status: 'pending', dependencies: ['useD1Database'] },
  { file: 'src/components/auth/AuthProvider.tsx', status: 'in-progress', dependencies: ['EOSAuthContext'] },
  { file: 'src/components/admin/UserManagement.tsx', status: 'pending', dependencies: ['d1Worker', 'useD1Database'] },
  { file: 'src/components/admin/SongManagement.tsx', status: 'pending', dependencies: ['d1Worker', 'useD1Database'] },
  { file: 'src/hooks/useUser.tsx', status: 'in-progress', dependencies: ['useD1Database'] },
  // Add more components as needed
];

// Function to track migration progress
export const getMigrationProgress = (): { completed: number, total: number } => {
  const completed = componentMigrations.filter(item => item.status === 'completed').length;
  return { completed, total: componentMigrations.length };
};

// Function to mark a component as migrated
export const markComponentMigrated = (file: string): void => {
  const component = componentMigrations.find(item => item.file === file);
  if (component) {
    component.status = 'completed';
    toast({
      title: "Migration Progress",
      description: `${file} successfully migrated to D1/EOS.`
    });
  }
};

// Get next components to migrate based on dependencies
export const getNextComponentsToMigrate = (): MigrationItem[] => {
  return componentMigrations
    .filter(item => item.status === 'pending')
    .sort((a, b) => a.dependencies.length - b.dependencies.length)
    .slice(0, 3);
};

// Utility to display migration status in console 
export const logMigrationStatus = (): void => {
  const { completed, total } = getMigrationProgress();
  console.log(`Migration Progress: ${completed}/${total} components migrated`);
  
  const pending = componentMigrations.filter(item => item.status !== 'completed');
  console.log('Pending migrations:', pending.map(i => i.file).join(', '));
};
