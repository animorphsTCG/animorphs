
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { yocoWorker } from '@/lib/payment/yocoWorker';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, refreshProfile } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user?.id || !token?.access_token) {
      navigate('/login');
      return;
    }
    
    const verifyPayment = async () => {
      setVerifying(true);
      try {
        // Get payment ID from URL query params
        const searchParams = new URLSearchParams(location.search);
        const paymentId = searchParams.get('payment_id');
        
        if (!paymentId) {
          setError('Payment ID not found in URL');
          setSuccess(false);
          return;
        }
        
        // Verify payment with our worker
        const result = await yocoWorker.verifyPayment(
          token.access_token,
          paymentId,
          user.id
        );
        
        if (result.success) {
          setSuccess(true);
          
          // Refresh user profile to get updated payment status
          await refreshProfile();
          
          toast({
            title: 'Payment Successful',
            description: 'Your account has been upgraded. Enjoy all game features!',
            variant: 'default',
          });
        } else {
          setSuccess(false);
          setError(result.error || 'Payment verification failed');
          
          toast({
            title: 'Payment Verification Failed',
            description: result.error || 'There was an issue verifying your payment',
            variant: 'destructive',
          });
        }
      } catch (err: any) {
        console.error('Payment verification error:', err);
        setSuccess(false);
        setError(err.message || 'An error occurred while verifying the payment');
        
        toast({
          title: 'Payment Verification Error',
          description: err.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
      } finally {
        setVerifying(false);
      }
    };
    
    verifyPayment();
  }, [user, token, location.search, navigate, refreshProfile]);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>
              Verifying your payment...
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            {verifying ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Verifying your payment</p>
                <p className="text-gray-500 mt-1">Please wait while we confirm your transaction</p>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">Payment Successful!</p>
                <p className="text-gray-500 mt-1 mb-6">Your account has been upgraded successfully</p>
                
                <div className="flex flex-col space-y-2 w-full max-w-xs">
                  <Button onClick={() => navigate('/battle')} className="w-full">
                    Start Playing
                  </Button>
                  <Button onClick={() => navigate('/profile')} variant="outline" className="w-full">
                    View Profile
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-lg font-medium">Payment Verification Failed</p>
                <p className="text-gray-500 mt-1 mb-2">{error || 'There was an issue with your payment'}</p>
                <p className="text-sm mb-6">If you believe this is an error, please contact support.</p>
                
                <div className="flex flex-col space-y-2 w-full max-w-xs">
                  <Button onClick={() => navigate('/profile')} className="w-full">
                    Return to Profile
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;
