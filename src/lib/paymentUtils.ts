
import { supabase } from "@/integrations/supabase/client";
import { PaymentStatus } from "@/types";

/**
 * Check if a user has paid for the full access
 * @param userId The user ID to check
 * @returns Promise resolving to boolean indicating payment status
 */
export async function checkUserPaymentStatus(userId: string): Promise<boolean> {
  try {
    if (!userId) return false;

    const { data, error } = await supabase
      .from('payment_status')
      .select('has_paid')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error("Error checking payment status:", error);
      return false;
    }

    return data?.has_paid || false;
  } catch (error) {
    console.error("Error in checkUserPaymentStatus:", error);
    return false;
  }
}

/**
 * Update the payment status for a user
 * @param userId The user ID to update
 * @param paymentDetails Payment details including method, etc.
 * @returns Promise resolving to boolean indicating success
 */
export async function updateUserPaymentStatus(
  userId: string, 
  paymentDetails: { 
    method: string; 
    transactionId?: string;
  }
): Promise<boolean> {
  try {
    if (!userId) return false;

    const { error } = await supabase
      .from('payment_status')
      .update({
        has_paid: true,
        payment_date: new Date().toISOString(),
        payment_method: paymentDetails.method,
        transaction_id: paymentDetails.transactionId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error("Error updating payment status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateUserPaymentStatus:", error);
    return false;
  }
}

/**
 * Get complete payment status information for a user
 * @param userId The user ID to check
 * @returns Promise resolving to PaymentStatus object or null
 */
export async function getUserPaymentInfo(userId: string): Promise<PaymentStatus | null> {
  try {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('payment_status')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error("Error getting payment info:", error);
      return null;
    }

    return data as PaymentStatus;
  } catch (error) {
    console.error("Error in getUserPaymentInfo:", error);
    return null;
  }
}
