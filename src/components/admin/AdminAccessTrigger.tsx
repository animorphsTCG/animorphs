
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { AdminAccessModal } from './AdminAccessModal';
import { useAdmin } from '@/modules/admin';
import { d1Database } from '@/lib/d1Database';

// Component to trigger admin access authentication
export function AdminAccessTrigger() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAdmin } = useAdmin();
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="icon"
        className="fixed top-4 right-4 z-50 bg-black/20 backdrop-blur-sm hover:bg-black/40"
        onClick={() => setIsModalOpen(true)}
        aria-label="Admin Access"
      >
        <Shield className={`h-5 w-5 ${isAdmin ? 'text-emerald-500' : 'text-muted-foreground'}`} />
      </Button>
      
      <AdminAccessModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
