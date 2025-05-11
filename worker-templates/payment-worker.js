
/**
 * Cloudflare Worker for YoCo Payment Integration
 * Handles payment processing via YoCo
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info',
};

// Helper function to handle CORS preflight requests
function handleOptions(request) {
  if (request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null) {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers'),
      }
    });
  } else {
    return new Response(null, {
      headers: corsHeaders
    });
  }
}

// Helper to verify authentication
async function verifyAuth(request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization');
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  // In production, this would verify the token with the EOS auth service
  // For now, we're just checking if a token exists
  if (!token) {
    throw new Error('Invalid token');
  }
  
  return token;
}

// Create a checkout session with YoCo
async function createCheckout(request, env) {
  try {
    // Verify authentication
    await verifyAuth(request);
    
    // Parse request body
    const { user_id, amount, name, description, successUrl, cancelUrl, metadata } = await request.json();
    
    if (!user_id || !amount || !name || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Determine YoCo API key based on environment
    const isProduction = env.NODE_ENV === 'production';
    const publicKey = isProduction ? env.YOCO_LIVE_PUBLIC_KEY : env.YOCO_TEST_PUBLIC_KEY;
    const secretKey = isProduction ? env.YOCO_LIVE_SECRET_KEY : env.YOCO_TEST_SECRET_KEY;
    
    if (!publicKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: 'YoCo API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Call YoCo API to create checkout session
    const yocoResponse = await fetch('https://online.yoco.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'X-Auth-Secret-Key': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount, // Amount in cents
        currency: 'ZAR',
        name,
        description,
        callback_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          user_id,
          ...metadata
        }
      })
    });
    
    if (!yocoResponse.ok) {
      const errorData = await yocoResponse.json();
      throw new Error(errorData.message || `YoCo API error: ${yocoResponse.statusText}`);
    }
    
    const checkoutData = await yocoResponse.json();
    
    // Store checkout ID in database
    await env.DB.prepare(`
      INSERT INTO payment_checkouts (id, user_id, amount, status, created_at)
      VALUES (?, ?, ?, 'pending', ?)
    `).bind(
      checkoutData.id,
      user_id,
      amount,
      new Date().toISOString()
    ).run();
    
    return new Response(
      JSON.stringify({
        id: checkoutData.id,
        url: checkoutData.redirectUrl,
        status: 'created',
        created_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create checkout' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Verify a payment
async function verifyPayment(request, env) {
  try {
    // Verify authentication
    await verifyAuth(request);
    
    // Parse request body
    const { payment_id, user_id } = await request.json();
    
    if (!payment_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing payment_id or user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Determine YoCo API key based on environment
    const isProduction = env.NODE_ENV === 'production';
    const secretKey = isProduction ? env.YOCO_LIVE_SECRET_KEY : env.YOCO_TEST_SECRET_KEY;
    
    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: 'YoCo API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check payment status with YoCo API
    const yocoResponse = await fetch(`https://online.yoco.com/v1/checkouts/${payment_id}`, {
      method: 'GET',
      headers: {
        'X-Auth-Secret-Key': secretKey,
        'Content-Type': 'application/json',
      }
    });
    
    if (!yocoResponse.ok) {
      const errorData = await yocoResponse.json();
      throw new Error(errorData.message || `YoCo API error: ${yocoResponse.statusText}`);
    }
    
    const paymentData = await yocoResponse.json();
    
    // Check if payment is successful
    if (paymentData.status === 'paid') {
      // Update checkout status
      await env.DB.prepare(`
        UPDATE payment_checkouts 
        SET status = 'completed', updated_at = ?
        WHERE id = ?
      `).bind(
        new Date().toISOString(),
        payment_id
      ).run();
      
      // Update user's payment status
      await env.DB.prepare(`
        INSERT OR REPLACE INTO payment_status 
        (id, has_paid, payment_date, payment_method, transaction_id, updated_at)
        VALUES (?, 1, ?, 'yoco', ?, ?)
      `).bind(
        user_id,
        new Date().toISOString(),
        payment_id,
        new Date().toISOString()
      ).run();
      
      return new Response(
        JSON.stringify({
          success: true,
          payment_id,
          user_id,
          status: 'paid'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Payment not successful
      return new Response(
        JSON.stringify({
          success: false,
          payment_id,
          user_id,
          status: paymentData.status,
          error: 'Payment not completed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to verify payment' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Get payment history for a user
async function getPaymentHistory(request, env) {
  try {
    // Verify authentication
    await verifyAuth(request);
    
    // Get user ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 2 || pathParts[0] !== 'payment-history') {
      throw new Error('Invalid URL format');
    }
    
    const userId = pathParts[1];
    
    // Query payment history from database
    const checkouts = await env.DB.prepare(`
      SELECT c.id, c.amount, c.status, c.created_at, c.updated_at
      FROM payment_checkouts c
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).bind(userId).all();
    
    return new Response(
      JSON.stringify({ payments: checkouts.results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get payment history' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Handle webhook from YoCo
async function handleWebhook(request, env) {
  try {
    // Verify YoCo webhook signature
    // For real implementation, this would validate the signature from YoCo
    
    // Parse webhook data
    const webhookData = await request.json();
    
    if (webhookData.event !== 'checkout.paid') {
      // Only handle successful payments
      return new Response(
        JSON.stringify({ received: true, action: 'ignored' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { id: payment_id, metadata } = webhookData.data;
    const user_id = metadata?.user_id;
    
    if (!payment_id || !user_id) {
      throw new Error('Missing payment_id or user_id in webhook data');
    }
    
    // Update checkout status
    await env.DB.prepare(`
      UPDATE payment_checkouts 
      SET status = 'completed', updated_at = ?
      WHERE id = ?
    `).bind(
      new Date().toISOString(),
      payment_id
    ).run();
    
    // Update user's payment status
    await env.DB.prepare(`
      INSERT OR REPLACE INTO payment_status 
      (id, has_paid, payment_date, payment_method, transaction_id, updated_at)
      VALUES (?, 1, ?, 'yoco', ?, ?)
    `).bind(
      user_id,
      new Date().toISOString(),
      payment_id,
      new Date().toISOString()
    ).run();
    
    return new Response(
      JSON.stringify({ received: true, processed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process webhook' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Main request handler
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      // Route request based on path
      if (path === '/create-checkout' && request.method === 'POST') {
        return createCheckout(request, env);
      } else if (path === '/verify-payment' && request.method === 'POST') {
        return verifyPayment(request, env);
      } else if (path.startsWith('/payment-history/') && request.method === 'GET') {
        return getPaymentHistory(request, env);
      } else if (path === '/webhook' && request.method === 'POST') {
        return handleWebhook(request, env);
      } else {
        return new Response('Not found', { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message || 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
};
