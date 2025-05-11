
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useAuth } from '@/modules/auth';
import { verifyPayment, PaymentVerificationResult } from '@/lib/payment';
import { Loader2 } from 'lucide-react';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile, token } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    async function verifyAndUpdatePayment() {
      if (!sessionId || !token?.access_token) {
        setIsVerifying(false);
        setVerificationError('No payment session found or user not authenticated');
        return;
      }

      try {
        const result = await verifyPayment(token.access_token, sessionId);
        
        if (result.success) {
          // Refresh the user profile to get updated payment status
          await refreshProfile();
        } else {
          setVerificationError(result.error || 'Payment verification failed');
        }
      } catch (error: any) {
        console.error('Error verifying payment:', error);
        setVerificationError(error.message || 'An error occurred while verifying payment');
      } finally {
        setIsVerifying(false);
      }
    }

    verifyAndUpdatePayment();
  }, [sessionId, refreshProfile, token]);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center">
              {isVerifying ? (
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
              ) : verificationError ? (
                <Icons.error className="h-6 w-6 text-red-500 mr-2" />
              ) : (
                <Icons.check className="h-6 w-6 text-green-500 mr-2" />
              )}
              Payment {isVerifying ? 'Processing' : verificationError ? 'Error' : 'Successful'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isVerifying ? (
              <div className="text-center py-6">
                <p className="mb-4">Verifying your payment...</p>
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </div>
            ) : verificationError ? (
              <div className="space-y-6">
                <p className="text-center text-red-500">{verificationError}</p>
                <p className="text-center">
                  There was a problem verifying your payment. If funds were deducted, please contact support.
                </p>
                <div className="flex justify-center">
                  <Button onClick={() => navigate('/profile')}>
                    Return to Profile
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center mb-6">
                  <div className="rounded-full bg-green-100 p-3">
                    <Icons.check className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-center">Thank you for your purchase!</h2>
                
                <p className="text-center">
                  Your payment was successful and your account has been upgraded to full access.
                </p>
                
                <div className="border-t border-b py-4 my-6">
                  <div className="flex justify-between">
                    <span>Amount paid:</span>
                    <span className="font-bold">R100 ZAR</span>
                  </div>
                </div>
                
                <p className="text-center text-sm">
                  You now have access to all game modes and all 200 cards.
                </p>
                
                <div className="flex flex-col space-y-2">
                  <Button onClick={() => navigate('/card-gallery')}>
                    View All Cards
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/profile')}
                  >
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
