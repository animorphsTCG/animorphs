
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

const PaymentCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center">
              <X className="h-6 w-6 text-gray-500 mr-2" />
              Payment Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-center">
                Your payment process was cancelled. No charges have been made.
              </p>
              
              <p className="text-center">
                You can still enjoy the game in demo mode or try the payment again when you're ready.
              </p>
              
              <div className="flex flex-col space-y-2">
                <Button onClick={() => navigate('/profile')}>
                  Return to Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCancelled;
