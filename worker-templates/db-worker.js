
// Cloudflare D1 Database Worker

// CORS headers with improved domain handling
const getAllowedOrigins = () => {
  return [
    'https://tcg.mythicmasters.org.za',
    'https://www.mythicmasters.org.za',
    'https://mythicmasters.org.za',
    'https://animorphs.workers.dev',
    'http://localhost:3000',
    'http://localhost:5173',
    // Add the deployment preview URL pattern
    /https:\/\/deploy-preview-\d+--animorphs\.netlify\.app/
  ];
};

// Helper function to handle CORS and set proper origin
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = getAllowedOrigins();
  
  // Check if the origin is allowed (including regex patterns)
  const isAllowedOrigin = allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin);
    }
    return allowedOrigin === origin;
  });
  
  // If origin is allowed, reflect it back, otherwise use the first allowed origin
  const effectiveOrigin = isAllowedOrigin ? origin : allowedOrigins[0];
  
  console.log(`Request from origin: ${origin}, Allowed: ${isAllowedOrigin}`);
  
  return {
    'Access-Control-Allow-Origin': effectiveOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400', // Cache preflight requests for 24 hours
    'Access-Control-Allow-Credentials': 'true'
  };
}

// Helper functions for request/response handling
function parseToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

function corsResponse(body, status = 200, request) {
  const headers = {
    ...getCorsHeaders(request),
    'Content-Type': 'application/json'
  };
  
  return new Response(JSON.stringify(body), { status, headers });
}

function errorResponse(message, status = 400, request) {
  return corsResponse({ error: message }, status, request);
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
    // Enhanced logging for debugging
    console.log(`Request received: ${request.method} ${new URL(request.url).pathname}`);
    console.log(`Origin: ${request.headers.get('Origin')}`);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      console.log('Handling CORS preflight request');
      return new Response(null, { 
        headers: getCorsHeaders(request),
        status: 204
      });
    }
    
    // Parse the URL to get the path
    const url = new URL(request.url);
    const path = url.pathname.slice(1);
    
    console.log(`Processing path: ${path}`);
    
    try {
      // Health check doesn't require authentication
      if (path === 'health') {
        console.log('Health check requested');
        return corsResponse({ status: 'ok', message: 'DB worker is running' }, 200, request);
      }
      
      // All other routes require authentication
      const token = parseToken(request);
      console.log(`Token present: ${!!token}`);
      
      // Skip auth for health check
      if (path !== 'health') {
        const userId = await verifyToken(token);
        console.log(`User ID from token: ${userId || 'none'}`);
        
        if (!userId) {
          console.log('Unauthorized access attempt');
          return errorResponse('Unauthorized', 401, request);
        }
        
        // Store userId in env for access in route handlers
        env.userId = userId;
      }
      
      // Route handlers
      switch (path) {
        case 'health':
          return corsResponse({ 
            status: 'ok', 
            message: 'DB worker is running', 
            timestamp: new Date().toISOString() 
          }, 200, request);
          
        case 'query':
          console.log('Query endpoint requested');
          return await handleQuery(request, env);
          
        case 'transaction':
          console.log('Transaction endpoint requested');
          return await handleTransaction(request, env);
          
        default:
          console.log(`Unknown path requested: ${path}`);
          return errorResponse('Not Found', 404, request);
      }
    } catch (error) {
      console.error('Worker error:', error);
      return errorResponse(error.message || 'Internal Server Error', 500, request);
    }
  }
};

// Handle database queries
async function handleQuery(request, env) {
  const { sql, params = [], timeout, metaOnly = false } = await request.json();
  
  console.log(`Executing SQL query: ${sql.substring(0, 100)}...`);
  console.log(`With params: ${JSON.stringify(params)}`);
  
  if (!sql) {
    return errorResponse('Missing SQL query', 400, request);
  }
  
  try {
    console.log('Preparing SQL statement');
    const stmt = await env.DB.prepare(sql);
    
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        stmt.bind(index + 1, param);
      });
      console.log('Bound parameters to statement');
    }
    
    if (timeout) {
      stmt.timeout(timeout);
      console.log(`Set timeout to ${timeout}ms`);
    }
    
    let results;
    if (metaOnly) {
      console.log('Getting metadata only');
      results = await stmt.meta();
    } else {
      console.log('Executing query and getting all results');
      results = await stmt.all();
    }
    
    console.log(`Query executed successfully, returned ${results.results ? results.results.length : 0} rows`);
    
    return corsResponse({
      results: results.results || [],
      success: true
    }, 200, request);
  } catch (error) {
    console.error('Query error:', error);
    return errorResponse(`SQL error: ${error.message}`, 400, request);
  }
}

// Handle database transactions
async function handleTransaction(request, env) {
  const { statements } = await request.json();
  
  console.log(`Transaction requested with ${statements ? statements.length : 0} statements`);
  
  if (!statements || !Array.isArray(statements) || statements.length === 0) {
    return errorResponse('Invalid transaction data', 400, request);
  }
  
  try {
    // Start a transaction
    console.log('Preparing transaction batch');
    const tx = await env.DB.batch(statements.map(stmt => {
      const prepared = env.DB.prepare(stmt.sql);
      if (stmt.params && stmt.params.length > 0) {
        return prepared.bind(...stmt.params);
      }
      return prepared;
    }));
    
    console.log(`Transaction executed successfully, affected ${tx.length} statements`);
    
    return corsResponse({
      success: true,
      affected: tx.length
    }, 200, request);
  } catch (error) {
    console.error('Transaction error:', error);
    return errorResponse(`Transaction error: ${error.message}`, 400, request);
  }
}
