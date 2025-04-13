
import { supabase } from '@/lib/supabase';

export async function createCheckoutSession(): Promise<{ url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId: 'price_zar_100', // This is just a placeholder, actual ID will be set in the edge function
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: `${window.location.origin}/payment-cancelled`
      }
    });

    if (error) {
      throw error;
    }

    return { url: data.url };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return { error: error.message || 'Failed to create checkout session' };
  }
}

export async function verifyPayment(sessionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: { 
        sessionId 
      }
    });

    if (error) {
      throw error;
    }

    return { success: data.success };
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return { 
      success: false, 
      error: error.message || 'Payment verification failed' 
    };
  }
}
