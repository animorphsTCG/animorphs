
// This is a template for a Cloudflare Worker with D1 database
// It would be deployed to Cloudflare using Wrangler

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Parse the URL to get the path
    const url = new URL(request.url);
    
    try {
      // Verify authentication (except for webhook endpoint)
      if (!url.pathname.includes('/webhook')) {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Get the token
        const token = authHeader.replace('Bearer ', '');
        
        // Validate the token (in a real implementation, we would verify with EOS)
        // For now, we'll assume the token is valid
      }
      
      // Routes
      if (url.pathname === '/create-checkout' && request.method === 'POST') {
        // Create YoCo checkout
        const data = await request.json();
        
        // Get YoCo API key based on environment
        const yocoApiKey = env.NODE_ENV === 'production'
          ? env.YOCO_LIVE_SECRET_KEY
          : env.YOCO_TEST_SECRET_KEY;
          
        // Create checkout session with YoCo API
        const checkoutResponse = await fetch('https://online.yoco.com/v1/checkouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${yocoApiKey}`
          },
          body: JSON.stringify({
            amount: data.amount,
            currency: data.currency,
            name: data.name,
            description: data.description,
            metadata: data.metadata,
            callback_url: data.successUrl,
            cancel_url: data.cancelUrl
          })
        });
        
        if (!checkoutResponse.ok) {
          const errorData = await checkoutResponse.json();
          throw new Error(errorData.message || 'Failed to create checkout');
        }
        
        const checkoutData = await checkoutResponse.json();
        
        return new Response(JSON.stringify({
          url: checkoutData.redirectUrl,
          id: checkoutData.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (url.pathname === '/verify-payment' && request.method === 'POST') {
        // Verify payment
        const { checkoutId } = await request.json();
        
        // Get YoCo API key based on environment
        const yocoApiKey = env.NODE_ENV === 'production'
          ? env.YOCO_LIVE_SECRET_KEY
          : env.YOCO_TEST_SECRET_KEY;
          
        // Verify payment with YoCo API
        const verifyResponse = await fetch(`https://online.yoco.com/v1/checkouts/${checkoutId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${yocoApiKey}`
          }
        });
        
        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(errorData.message || 'Failed to verify payment');
        }
        
        const paymentData = await verifyResponse.json();
        
        // Check if payment was successful
        const success = paymentData.status === 'succeeded';
        
        if (success) {
          // Update the user's payment status in the database
          const userId = paymentData.metadata.userId;
          
          const stmt = await env.DB.prepare(
            `UPDATE payment_status 
             SET has_paid = TRUE, 
                 payment_date = datetime('now'), 
                 payment_method = 'yoco', 
                 transaction_id = ?, 
                 updated_at = datetime('now') 
             WHERE id = ?`
          ).bind(checkoutId, userId);
          
          await stmt.run();
          
          // If there's a referrer, add Digi to them
          if (paymentData.metadata.referrerId) {
            const referrerStmt = await env.DB.prepare(
              `UPDATE profiles SET digi = digi + 5 WHERE id = ?`
            ).bind(paymentData.metadata.referrerId);
            
            await referrerStmt.run();
          }
        }
        
        return new Response(JSON.stringify({ success }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (url.pathname === '/webhook' && request.method === 'POST') {
        // YoCo webhook
        const webhookData = await request.json();
        
        // Verify webhook signature
        const signature = request.headers.get('x-yoco-signature');
        // In a real implementation, we would verify the signature
        // For now, we'll assume the webhook is valid
        
        if (webhookData.event === 'checkout.succeeded') {
          // Get user ID from metadata
          const userId = webhookData.data.metadata.userId;
          
          // Update user's payment status
          const stmt = await env.DB.prepare(
            `UPDATE payment_status 
             SET has_paid = TRUE, 
                 payment_date = datetime('now'), 
                 payment_method = 'yoco', 
                 transaction_id = ?, 
                 updated_at = datetime('now') 
             WHERE id = ?`
          ).bind(webhookData.data.id, userId);
          
          await stmt.run();
          
          // If there's a referrer, add Digi to them
          if (webhookData.data.metadata.referrerId) {
            const referrerStmt = await env.DB.prepare(
              `UPDATE profiles SET digi = digi + 5 WHERE id = ?`
            ).bind(webhookData.data.metadata.referrerId);
            
            await referrerStmt.run();
          }
        }
        
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
