
/**
 * YoCo Payment Worker Client
 * Handles payment processing via YoCo checkout and Cloudflare Worker
 */

// Configuration
const PAYMENT_WORKER_URL = 'https://payments.animorphs.workers.dev';

// Checkout options
export interface YocoCheckoutOptions {
  amount: number;                 // In cents (e.g., R100 = 10000)
  currency?: string;              // Default: ZAR
  name?: string;                  // Product name
  description?: string;           // Product description
  metadata?: Record<string, any>; // Additional data to store
  successUrl: string;             // Redirect after success
  cancelUrl: string;              // Redirect after cancel
}

// Response from checkout creation
export interface YocoCheckoutResponse {
  url: string;                   // Checkout URL to redirect to
  id: string;                    // Checkout ID for reference
}

// Payment verification result
export interface PaymentVerificationResult {
  success: boolean;
  error?: string;
}

// Standard HTTP headers
const getHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// YoCo worker client
export const yocoWorker = {
  // Create a checkout session
  async createCheckout(
    token: string,
    userId: string,
    options: YocoCheckoutOptions
  ): Promise<YocoCheckoutResponse> {
    try {
      const response = await fetch(`${PAYMENT_WORKER_URL}/create-checkout`, {
        method: 'POST',
        headers: getHeaders(token),
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
      console.error('[YoCo Worker] Error creating checkout:', error);
      throw error;
    }
  },
  
  // Verify a payment
  async verifyPayment(
    token: string,
    checkoutId: string
  ): Promise<PaymentVerificationResult> {
    try {
      const response = await fetch(`${PAYMENT_WORKER_URL}/verify-payment`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({ checkoutId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Payment verification failed'
        };
      }
      
      const result = await response.json();
      return {
        success: result.success,
        error: result.error
      };
    } catch (error: any) {
      console.error('[YoCo Worker] Error verifying payment:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while verifying payment'
      };
    }
  },
  
  // Get payment status
  async getPaymentStatus(
    token: string,
    userId: string
  ): Promise<{ has_paid: boolean, payment_date?: string, payment_method?: string }> {
    try {
      const response = await fetch(`${PAYMENT_WORKER_URL}/payment-status/${userId}`, {
        headers: getHeaders(token)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('[YoCo Worker] Error fetching payment status:', error);
      throw error;
    }
  }
};
