
/**
 * YoCo Payment Gateway Integration
 * Handles payment processing for South African users
 */

// YoCo API constants
const YOCO_TEST_MODE = import.meta.env.NODE_ENV !== 'production';
const YOCO_PUBLIC_KEY = YOCO_TEST_MODE 
  ? import.meta.env.YOCO_TEST_PUBLIC_KEY || 'pk_test_cc70b6bfZBmkRAM5c934'
  : import.meta.env.YOCO_LIVE_PUBLIC_KEY || 'pk_live_509c8ea1ZBmkRAM98454';
  
// Worker endpoint for YoCo checkout
const YOCO_WORKER_URL = 'https://payments.animorphs.workers.dev';

export interface YocoCheckoutOptions {
  amount: number; // In cents (e.g., R100 = 10000)
  currency?: string; // Default: ZAR
  name?: string; // Product name
  description?: string; // Product description
  metadata?: Record<string, string>; // Custom metadata
  successUrl: string; // Redirect URL after successful payment
  cancelUrl: string; // Redirect URL after cancelled payment
}

export interface YocoCheckoutResponse {
  url: string; // The checkout URL to redirect to
  id: string; // The checkout ID for reference
}

/**
 * Create a YoCo checkout session
 */
export const createCheckoutSession = async (
  token: string,
  userId: string,
  options: YocoCheckoutOptions
): Promise<YocoCheckoutResponse> => {
  try {
    const response = await fetch(`${YOCO_WORKER_URL}/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        amount: options.amount,
        currency: options.currency || 'ZAR',
        name: options.name || 'Full Game Access',
        description: options.description || 'Unlock all game modes and all 200 cards',
        metadata: {
          userId,
          ...options.metadata
        },
        successUrl: options.successUrl,
        cancelUrl: options.cancelUrl
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating YoCo checkout:', error);
    throw error;
  }
};

/**
 * Verify a completed payment
 */
export const verifyPayment = async (token: string, checkoutId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${YOCO_WORKER_URL}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ checkoutId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment verification failed');
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error verifying YoCo payment:', error);
    throw error;
  }
};
