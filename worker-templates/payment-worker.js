
// Cloudflare Payment Worker for YoCo integration

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Helper functions for request/response handling
function parseToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

function corsResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function errorResponse(message, status = 400) {
  return corsResponse({ error: message }, status);
}

// Verify and decode the JWT token
async function verifyToken(token) {
  if (!token) return null;
  
  try {
    // In a real implementation, this would validate with EOS
    // For now, just decode and return a user ID
    // This should be replaced with actual EOS token validation
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Main request handler
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Parse the URL to get the path
    const url = new URL(request.url);
    const path = url.pathname.slice(1);
    
    try {
      // Routes that don't require authentication
      if (path === 'health' || path === 'webhook') {
        if (path === 'health') {
          return corsResponse({ status: 'ok' });
        } else if (path === 'webhook' && request.method === 'POST') {
          return await handleWebhook(request, env);
        }
      }
      
      // All other routes require authentication
      const token = parseToken(request);
      const userId = await verifyToken(token);
      
      if (!userId) {
        return errorResponse('Unauthorized', 401);
      }
      
      // Store userId in env for access in route handlers
      env.userId = userId;
      
      // Route handlers
      switch (path) {
        case 'create-checkout':
          return await createCheckout(request, env);
          
        case 'verify-payment':
          return await verifyPayment(request, env);
          
        default:
          if (path.startsWith('payment-status/')) {
            const targetUserId = path.replace('payment-status/', '');
            return await getPaymentStatus(targetUserId, env);
          }
          
          return errorResponse('Not Found', 404);
      }
    } catch (error) {
      console.error('Worker error:', error);
      return errorResponse(error.message || 'Internal Server Error', 500);
    }
  }
};

// Create a YoCo checkout session
async function createCheckout(request, env) {
  const data = await request.json();
  
  if (!data.userId || !data.amount) {
    return errorResponse('Missing required fields');
  }
  
  // Get YoCo API key based on environment
  const yocoApiKey = env.NODE_ENV === 'production'
    ? env.YOCO_LIVE_SECRET_KEY
    : env.YOCO_TEST_SECRET_KEY;
  
  try {
    // Create checkout session with YoCo API
    const checkoutResponse = await fetch('https://online.yoco.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${yocoApiKey}`
      },
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency || 'ZAR',
        name: data.name || 'Full Game Access',
        description: data.description || 'Unlock all game modes and cards',
        metadata: {
          userId: data.userId,
          ...data.metadata
        },
        callback_url: data.successUrl,
        cancel_url: data.cancelUrl
      })
    });
    
    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json();
      return errorResponse(errorData.message || 'Failed to create checkout', 400);
    }
    
    const checkoutData = await checkoutResponse.json();
    
    return corsResponse({
      url: checkoutData.redirectUrl,
      id: checkoutData.id
    });
  } catch (error) {
    console.error('YoCo checkout error:', error);
    return errorResponse(`Checkout creation failed: ${error.message}`, 500);
  }
}

// Verify a payment
async function verifyPayment(request, env) {
  const { checkoutId } = await request.json();
  
  if (!checkoutId) {
    return errorResponse('Missing checkoutId');
  }
  
  // Get YoCo API key based on environment
  const yocoApiKey = env.NODE_ENV === 'production'
    ? env.YOCO_LIVE_SECRET_KEY
    : env.YOCO_TEST_SECRET_KEY;
  
  try {
    // Verify checkout with YoCo API
    const verifyResponse = await fetch(`https://online.yoco.com/v1/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${yocoApiKey}`
      }
    });
    
    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      return errorResponse(errorData.message || 'Failed to verify payment', 400);
    }
    
    const paymentData = await verifyResponse.json();
    
    // Check payment status
    if (paymentData.status === 'succeeded') {
      // Get user ID from metadata
      const userId = paymentData.metadata?.userId;
      
      if (userId) {
        // Update user's payment status
        await updatePaymentStatus(userId, checkoutId, env);
        
        // Process referral if exists
        if (paymentData.metadata?.referrerId) {
          await processReferralBonus(paymentData.metadata.referrerId, env);
        }
      }
      
      return corsResponse({ success: true });
    } else {
      return corsResponse({ 
        success: false, 
        error: `Payment not completed. Status: ${paymentData.status}` 
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return errorResponse(`Verification failed: ${error.message}`, 500);
  }
}

// Handle YoCo webhook events
async function handleWebhook(request, env) {
  // Verify webhook signature
  const signature = request.headers.get('x-yoco-signature');
  
  // In a production implementation, we would verify the signature
  // using the webhook secret and the request body
  
  try {
    const webhookData = await request.json();
    
    if (webhookData.event === 'checkout.succeeded') {
      // Get user ID from metadata
      const userId = webhookData.data.metadata?.userId;
      
      if (userId) {
        // Update payment status
        await updatePaymentStatus(userId, webhookData.data.id, env);
        
        // Process referral bonus if exists
        if (webhookData.data.metadata?.referrerId) {
          await processReferralBonus(webhookData.data.metadata.referrerId, env);
        }
      }
    }
    
    return corsResponse({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return errorResponse(`Webhook processing failed: ${error.message}`, 500);
  }
}

// Update a user's payment status
async function updatePaymentStatus(userId, transactionId, env) {
  const sql = `
    UPDATE payment_status 
    SET has_paid = TRUE, 
        payment_date = datetime('now'), 
        payment_method = 'yoco', 
        transaction_id = ?, 
        updated_at = datetime('now') 
    WHERE id = ?
  `;
  
  const stmt = await env.DB.prepare(sql).bind(transactionId, userId);
  await stmt.run();
  
  console.log(`Updated payment status for user ${userId}`);
  return true;
}

// Process referral bonus (add Digi to referrer)
async function processReferralBonus(referrerId, env) {
  const REFERRAL_BONUS = 5; // 5 Digi as per requirements
  
  const sql = `
    UPDATE profiles 
    SET digi = digi + ? 
    WHERE id = ?
  `;
  
  const stmt = await env.DB.prepare(sql).bind(REFERRAL_BONUS, referrerId);
  await stmt.run();
  
  console.log(`Added ${REFERRAL_BONUS} Digi to referrer ${referrerId}`);
  return true;
}

// Get payment status for a user
async function getPaymentStatus(userId, env) {
  if (!userId) {
    return errorResponse('Missing userId');
  }
  
  try {
    const sql = `
      SELECT has_paid, payment_date, payment_method 
      FROM payment_status 
      WHERE id = ?
    `;
    
    const stmt = await env.DB.prepare(sql).bind(userId);
    const result = await stmt.first();
    
    if (!result) {
      return corsResponse({ has_paid: false });
    }
    
    return corsResponse({
      has_paid: result.has_paid === 1, // SQLite returns 1/0 for boolean
      payment_date: result.payment_date,
      payment_method: result.payment_method
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return errorResponse(`Failed to get payment status: ${error.message}`, 500);
  }
}
