
import { d1Worker } from "@/lib/cloudflare/d1Worker";
import { PaymentStatus } from "@/types";

/**
 * Check if a user has paid for the full access
 * @param userId The user ID to check
 * @returns Promise resolving to boolean indicating payment status
 */
export async function checkUserPaymentStatus(userId: string): Promise<boolean> {
  try {
    if (!userId) return false;

    // Find the profile by user ID
    const profile = await d1Worker.getOne(
      'SELECT id FROM profiles WHERE username = ?',
      { params: [userId] }
    );
      
    if (!profile) {
      console.error("Profile not found");
      return false;
    }

    // Then use the ID to check payment status
    const data = await d1Worker.getOne(
      'SELECT has_paid FROM payment_status WHERE id = ?',
      { params: [profile.id] }
    );
      
    if (!data) {
      console.error("Payment status not found");
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

    // Find the profile by user ID
    const profile = await d1Worker.getOne(
      'SELECT id FROM profiles WHERE username = ?',
      { params: [userId] }
    );
      
    if (!profile) {
      console.error("Profile not found");
      return false;
    }

    // Update payment status using ID
    const now = new Date().toISOString();
    await d1Worker.execute(
      `UPDATE payment_status 
       SET has_paid = ?, 
           payment_date = ?, 
           payment_method = ?, 
           transaction_id = ?, 
           updated_at = ?
       WHERE id = ?`,
      [
        1, // true for SQLite
        now,
        paymentDetails.method,
        paymentDetails.transactionId || null,
        now,
        profile.id
      ]
    );

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

    // Find the profile by user ID
    const profile = await d1Worker.getOne(
      'SELECT id FROM profiles WHERE username = ?',
      { params: [userId] }
    );
      
    if (!profile) {
      console.error("Profile not found");
      return null;
    }

    // Get payment info using profile ID
    const data = await d1Worker.getOne(
      'SELECT * FROM payment_status WHERE id = ?',
      { params: [profile.id] }
    );
      
    if (!data) {
      console.error("Payment info not found");
      return null;
    }

    return {
      has_paid: Boolean(data.has_paid),
      payment_date: data.payment_date,
      payment_method: data.payment_method,
      transaction_id: data.transaction_id,
      updated_at: data.updated_at,
      created_at: data.created_at,
      id: data.id
    } as PaymentStatus;
  } catch (error) {
    console.error("Error in getUserPaymentInfo:", error);
    return null;
  }
}
