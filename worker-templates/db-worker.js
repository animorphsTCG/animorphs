
// Cloudflare D1 Database Worker

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
      // All routes except health check require authentication
      if (path !== 'health') {
        const token = parseToken(request);
        const userId = await verifyToken(token);
        
        if (!userId) {
          return errorResponse('Unauthorized', 401);
        }
        
        // Store userId in env for access in route handlers
        env.userId = userId;
      }
      
      // Route handlers
      switch (path) {
        case 'health':
          return corsResponse({ status: 'ok' });
          
        case 'query':
          return await handleQuery(request, env);
          
        case 'transaction':
          return await handleTransaction(request, env);
          
        default:
          return errorResponse('Not Found', 404);
      }
    } catch (error) {
      console.error('Worker error:', error);
      return errorResponse(error.message || 'Internal Server Error', 500);
    }
  }
};

// Handle database queries
async function handleQuery(request, env) {
  const { sql, params = [], timeout, metaOnly = false } = await request.json();
  
  if (!sql) {
    return errorResponse('Missing SQL query');
  }
  
  try {
    const stmt = await env.DB.prepare(sql);
    
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        stmt.bind(index + 1, param);
      });
    }
    
    if (timeout) {
      stmt.timeout(timeout);
    }
    
    let results;
    if (metaOnly) {
      results = await stmt.meta();
    } else {
      results = await stmt.all();
    }
    
    return corsResponse({
      results: results.results || [],
      success: true
    });
  } catch (error) {
    console.error('Query error:', error);
    return errorResponse(`SQL error: ${error.message}`, 400);
  }
}

// Handle database transactions
async function handleTransaction(request, env) {
  const { statements } = await request.json();
  
  if (!statements || !Array.isArray(statements) || statements.length === 0) {
    return errorResponse('Invalid transaction data');
  }
  
  try {
    // Start a transaction
    const tx = await env.DB.batch(statements.map(stmt => {
      const prepared = env.DB.prepare(stmt.sql);
      if (stmt.params && stmt.params.length > 0) {
        return prepared.bind(...stmt.params);
      }
      return prepared;
    }));
    
    return corsResponse({
      success: true,
      affected: tx.length
    });
  } catch (error) {
    console.error('Transaction error:', error);
    return errorResponse(`Transaction error: ${error.message}`, 400);
  }
}
