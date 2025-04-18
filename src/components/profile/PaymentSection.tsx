
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { createCheckoutSession } from '@/lib/payment';

interface PaymentSectionProps {
  userProfile: UserProfile;
  onPaymentComplete: () => void;
}

export default function PaymentSection({ userProfile, onPaymentComplete }: PaymentSectionProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePaymentClick = async () => {
    setIsLoading(true);
    try {
      const { url, error } = await createCheckoutSession();
      
      if (error) {
        throw new Error(error);
      }
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: error.message || 'An error occurred while processing payment',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (userProfile.has_paid) {
    return (
      <div className="space-y-4">
        <div className="bg-green-100 text-green-800 p-4 rounded-md">
          <p className="font-medium">Full Access Unlocked</p>
          <p className="text-sm mt-1">You have access to all game modes and cards.</p>
        </div>
        
        <div className="mt-4">
          <Button onClick={() => window.location.href = '/battle'} className="w-full">
            Play Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md">
        <p className="font-medium">Demo Access</p>
        <p className="text-sm mt-1">Unlock all game modes and 200 cards with a one-time payment.</p>
      </div>
      
      <div className="border rounded-md p-4">
        <h3 className="font-medium mb-2">Full Game Access</h3>
        <ul className="space-y-2 text-sm mb-4">
          <li className="flex items-center">
            <Icons.check className="mr-2 h-4 w-4 text-green-500" />
            All 200 cards unlocked
          </li>
          <li className="flex items-center">
            <Icons.check className="mr-2 h-4 w-4 text-green-500" />
            All game modes
          </li>
          <li className="flex items-center">
            <Icons.check className="mr-2 h-4 w-4 text-green-500" />
            One-time payment (no subscription)
          </li>
        </ul>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold">R100 ZAR</span>
          <span className="text-sm text-gray-500">One-time payment</span>
        </div>
        
        <Button 
          onClick={handlePaymentClick} 
          disabled={isLoading} 
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Unlock Full Game'
          )}
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        Payments processed securely via Stripe
      </p>
    </div>
  );
}
