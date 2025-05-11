
/**
 * YoCo Payment Worker Client
 * Handles payment processing via YoCo integrated with Cloudflare Worker
 */

// Configuration
const CF_PAYMENT_URL = 'https://payment.animorphs.workers.dev';

// YoCo checkout session response
export interface YocoCheckoutResponse {
  id: string;
  url: string;
  status: string;
  created_at: string;
}

// Payment verification response
export interface PaymentVerificationResponse {
  success: boolean;
  error?: string;
  payment_id?: string;
  user_id?: string;
}

// Checkout session options
export interface CreateCheckoutOptions {
  amount: number; // amount in cents
  name: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, any>;
}

// Standard HTTP headers for requests
const getHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// YoCo payment worker methods
export const yocoWorker = {
  // Create a checkout session
  async createCheckout(
    token: string,
    userId: string,
    options: CreateCheckoutOptions
  ): Promise<YocoCheckoutResponse> {
    try {
      const response = await fetch(`${CF_PAYMENT_URL}/create-checkout`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({
          user_id: userId,
          ...options
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Payment creation failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as YocoCheckoutResponse;
    } catch (error) {
      console.error('[YoCo Worker] Error creating checkout:', error);
      throw error;
    }
  },
  
  // Verify payment status
  async verifyPayment(
    token: string,
    paymentId: string,
    userId: string
  ): Promise<PaymentVerificationResponse> {
    try {
      const response = await fetch(`${CF_PAYMENT_URL}/verify-payment`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({
          payment_id: paymentId,
          user_id: userId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || `Payment verification failed: ${response.statusText}`
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        payment_id: data.payment_id,
        user_id: data.user_id
      };
    } catch (error) {
      console.error('[YoCo Worker] Error verifying payment:', error);
      return {
        success: false,
        error: error.message || 'Unknown error during payment verification'
      };
    }
  },
  
  // Get payment history
  async getPaymentHistory(token: string, userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${CF_PAYMENT_URL}/payment-history/${userId}`, {
        headers: getHeaders(token)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payment history: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.payments || [];
    } catch (error) {
      console.error('[YoCo Worker] Error fetching payment history:', error);
      throw error;
    }
  }
};
