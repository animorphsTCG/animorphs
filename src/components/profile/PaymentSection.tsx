
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check, CreditCard, Lock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/ClerkAuthContext";

interface PaymentSectionProps {
  paymentStatus: {
    has_paid: boolean;
    payment_date: string | null;
    payment_method: string | null;
  } | null;
  setPaymentStatus: React.Dispatch<React.SetStateAction<{
    has_paid: boolean;
    payment_date: string | null;
    payment_method: string | null;
  } | null>>;
  userId: string;
}

interface PayPalButtonProps {
  amount: string;
  currency: string;
  onSuccess: (details: any) => void;
}

// PayPal Button Component
const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, currency, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Simulate PayPal payment process
  const handlePayPalClick = async () => {
    setIsLoading(true);
    
    // Simulate PayPal integration
    // In a real implementation, this would be replaced with the actual PayPal SDK
    try {
      setTimeout(() => {
        // Mock successful payment
        const paymentDetails = {
          id: `PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          status: "COMPLETED",
          payer: {
            email_address: "customer@example.com"
          },
          purchase_units: [{
            amount: {
              value: amount,
              currency_code: currency
            }
          }],
          create_time: new Date().toISOString()
        };
        
        onSuccess(paymentDetails);
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again."
      });
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      variant="outline"
      className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white border-0"
      onClick={handlePayPalClick}
      disabled={isLoading}
    >
      {isLoading ? "Processing..." : "Pay with PayPal"}
    </Button>
  );
};

// Credit Card Button Component
const CreditCardButton: React.FC<PayPalButtonProps> = ({ amount, currency, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Simulate credit card payment process
  const handleCreditCardClick = () => {
    setIsLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      // Mock successful payment
      const paymentDetails = {
        id: `CARD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        status: "COMPLETED",
        payment_method: "CREDIT_CARD",
        create_time: new Date().toISOString()
      };
      
      onSuccess(paymentDetails);
      setIsLoading(false);
    }, 2000);
  };
  
  return (
    <Button 
      variant="outline"
      className="w-full bg-gray-800 hover:bg-gray-700 text-white"
      onClick={handleCreditCardClick}
      disabled={isLoading}
    >
      <CreditCard className="mr-2 h-4 w-4" />
      {isLoading ? "Processing..." : "Pay with Credit Card"}
    </Button>
  );
};

const PaymentSection: React.FC<PaymentSectionProps> = ({ 
  paymentStatus, 
  setPaymentStatus, 
  userId 
}) => {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const { user } = useAuth();
  
  // Process successful payment
  const handlePaymentSuccess = async (paymentDetails: any) => {
    try {
      // First, find the profile by username (which contains the Clerk ID)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', user?.id || userId)
        .maybeSingle();
        
      if (profileError || !profile) {
        console.error("Error finding profile:", profileError || "Profile not found");
        toast({
          variant: "destructive",
          title: "Payment confirmation failed",
          description: "Your payment was processed, but we couldn't update your account. Please contact support."
        });
        return;
      }
      
      // Update the payment status in the database using the Supabase UUID
      const { error } = await supabase
        .from('payment_status')
        .update({
          has_paid: true,
          payment_date: new Date().toISOString(),
          payment_method: paymentDetails.payment_method || 'PayPal',
          transaction_id: paymentDetails.id
        })
        .eq('id', profile.id);
        
      if (error) {
        console.error("Error updating payment status:", error);
        toast({
          variant: "destructive",
          title: "Payment confirmation failed",
          description: "Your payment was processed, but we couldn't update your account. Please contact support."
        });
        return;
      }
      
      // Update local state
      setPaymentStatus({
        has_paid: true,
        payment_date: new Date().toISOString(),
        payment_method: paymentDetails.payment_method || 'PayPal'
      });
      
      // Show success message
      toast({
        title: "Payment successful!",
        description: "You now have access to all battle modes and 200 cards!",
      });
      
      // Hide payment options
      setShowPaymentOptions(false);
    } catch (err) {
      console.error("Error handling payment success:", err);
      toast({
        variant: "destructive",
        title: "Error updating account",
        description: "Please contact support with your payment confirmation."
      });
    }
  };

  if (paymentStatus?.has_paid) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-green-400">
          <Check className="h-5 w-5" />
          <span className="font-medium">Card deck unlocked!</span>
        </div>
        
        <p className="text-sm text-gray-400">
          You have full access to all battle modes and all 200 cards.
          {paymentStatus.payment_date && (
            <span> Purchased on {new Date(paymentStatus.payment_date).toLocaleDateString()}</span>
          )}
        </p>
        
        <div className="mt-4">
          <Button onClick={() => window.location.href = "/battle"} className="fantasy-button">
            Go to Battle Modes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="bg-yellow-900/30 border-yellow-600">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          Access to battle modes requires a one-time payment of R100 ZAR.
        </AlertDescription>
      </Alert>
      
      {!showPaymentOptions ? (
        <Button 
          onClick={() => setShowPaymentOptions(true)} 
          className="w-full fantasy-button"
        >
          Unlock All Cards (R100 ZAR)
        </Button>
      ) : (
        <div className="space-y-4 border rounded p-4 bg-gray-900/50">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">Select Payment Method</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowPaymentOptions(false)}
            >
              Cancel
            </Button>
          </div>
          
          <div className="space-y-3">
            <PayPalButton 
              amount="100" 
              currency="ZAR" 
              onSuccess={handlePaymentSuccess} 
            />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-2 text-gray-400">or</span>
              </div>
            </div>
            
            <CreditCardButton 
              amount="100" 
              currency="ZAR" 
              onSuccess={handlePaymentSuccess} 
            />
            
            <div className="flex items-center justify-center text-xs text-gray-500 mt-4">
              <Lock className="h-3 w-3 mr-1" />
              Secure payment processing
            </div>
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-400 mt-2">
        Your payment unlocks all 200 cards and all battle modes permanently.
      </p>
    </div>
  );
};

export default PaymentSection;
