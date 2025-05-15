
// Cloudflare Worker for Admin API Operations

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

// Verify and decode the JWT token with additional admin check
async function verifyAdminToken(token, env) {
  if (!token) return null;
  
  try {
    // In a real implementation, this would validate with EOS
    // For now, just decode and check admin in DB
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.sub || null;
    
    if (!userId) return null;
    
    // Check admin status in database
    const stmt = env.DB.prepare(`
      SELECT is_admin FROM profiles WHERE id = ?
    `);
    
    const result = await stmt.bind(userId).first();
    
    if (!result || result.is_admin !== true) {
      return null;
    }
    
    return {
      userId,
      isAdmin: true
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// TOTP verification
async function verifyTotp(userId, code, env) {
  try {
    // Get the TOTP secret for this user
    const secretStmt = env.DB.prepare(`
      SELECT totp_secret FROM admin_totp_secrets 
      WHERE user_id = ? AND is_active = true
    `);
    
    const secretResult = await secretStmt.bind(userId).first();
    
    if (!secretResult) {
      return {
        success: false,
        message: 'TOTP not set up for this user'
      };
    }
    
    // In a real implementation, we would verify the TOTP code using the secret
    // For now, accept any 6-digit code as valid for demo purposes
    const isValid = /^\d{6}$/.test(code);
    
    if (isValid) {
      // Update last used timestamp
      const updateStmt = env.DB.prepare(`
        UPDATE admin_totp_secrets 
        SET last_used_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `);
      
      await updateStmt.bind(userId).run();
    }
    
    return {
      success: isValid,
      message: isValid ? 'TOTP verification successful' : 'Invalid TOTP code'
    };
  } catch (error) {
    console.error('TOTP verification error:', error);
    return {
      success: false,
      message: 'TOTP verification failed'
    };
  }
}

// Generate backup codes
async function generateBackupCodes(userId, env) {
  try {
    // First, clear any existing backup codes
    const clearStmt = env.DB.prepare(`
      DELETE FROM admin_backup_codes WHERE user_id = ?
    `);
    
    await clearStmt.bind(userId).run();
    
    // Generate new backup codes
    const codes = [];
    for (let i = 0; i < 10; i++) {
      // Generate a random 8-character code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
      
      // Insert code into database
      const insertStmt = env.DB.prepare(`
        INSERT INTO admin_backup_codes (id, user_id, backup_code)
        VALUES (?, ?, ?)
      `);
      
      await insertStmt.bind(
        crypto.randomUUID(),
        userId,
        code
      ).run();
    }
    
    return {
      success: true,
      codes
    };
  } catch (error) {
    console.error('Error generating backup codes:', error);
    return {
      success: false,
      message: 'Failed to generate backup codes'
    };
  }
}

// Run a wrangler script
async function runWranglerScript(script, userId, env) {
  try {
    const scriptId = crypto.randomUUID();
    
    // Insert script into pending scripts table
    const insertStmt = env.DB.prepare(`
      INSERT INTO cloudflare_pending_scripts (id, script, created_by, status)
      VALUES (?, ?, ?, 'pending')
    `);
    
    await insertStmt.bind(
      scriptId,
      script,
      userId
    ).run();
    
    // In a real implementation, we might trigger the script execution here
    // For demo purposes, we'll just return success
    
    return {
      success: true,
      scriptId,
      message: 'Script added to execution queue'
    };
  } catch (error) {
    console.error('Error running script:', error);
    return {
      success: false,
      message: 'Failed to queue script for execution'
    };
  }
}

// Fetch Cloudflare errors
async function getCloudflareErrors(env) {
  try {
    const stmt = env.DB.prepare(`
      SELECT * FROM cloudflare_errors
      ORDER BY 
        CASE status 
          WHEN 'unresolved' THEN 1
          WHEN 'resolved' THEN 2
          WHEN 'ignored' THEN 3
        END,
        timestamp DESC
      LIMIT 100
    `);
    
    const result = await stmt.all();
    return {
      success: true,
      errors: result.results
    };
  } catch (error) {
    console.error('Error fetching Cloudflare errors:', error);
    return {
      success: false,
      message: 'Failed to fetch Cloudflare errors'
    };
  }
}

// Fetch pending scripts
async function getPendingScripts(env) {
  try {
    const stmt = env.DB.prepare(`
      SELECT * FROM cloudflare_pending_scripts
      ORDER BY 
        CASE status 
          WHEN 'pending' THEN 1
          WHEN 'failed' THEN 2
          WHEN 'completed' THEN 3
        END,
        created_at DESC
      LIMIT 50
    `);
    
    const result = await stmt.all();
    return {
      success: true,
      scripts: result.results
    };
  } catch (error) {
    console.error('Error fetching pending scripts:', error);
    return {
      success: false,
      message: 'Failed to fetch pending scripts'
    };
  }
}

// Update error status
async function updateErrorStatus(errorId, status, env) {
  try {
    const stmt = env.DB.prepare(`
      UPDATE cloudflare_errors
      SET status = ?
      WHERE id = ?
    `);
    
    await stmt.bind(status, errorId).run();
    return {
      success: true,
      message: `Error status updated to ${status}`
    };
  } catch (error) {
    console.error('Error updating error status:', error);
    return {
      success: false,
      message: 'Failed to update error status'
    };
  }
}

// Execute pending script
async function executePendingScript(scriptId, env) {
  try {
    // Get the script
    const getStmt = env.DB.prepare(`
      SELECT script FROM cloudflare_pending_scripts
      WHERE id = ?
    `);
    
    const scriptResult = await getStmt.bind(scriptId).first();
    
    if (!scriptResult) {
      return {
        success: false,
        message: 'Script not found'
      };
    }
    
    // In a real implementation, we would execute the script here
    // For demo purposes, we'll just mark it as completed with a random result
    
    const updateStmt = env.DB.prepare(`
      UPDATE cloudflare_pending_scripts
      SET status = 'completed', executed_at = CURRENT_TIMESTAMP, result = ?
      WHERE id = ?
    `);
    
    await updateStmt.bind(
      'Script executed successfully',
      scriptId
    ).run();
    
    return {
      success: true,
      message: 'Script executed successfully'
    };
  } catch (error) {
    console.error('Error executing script:', error);
    
    // Update status to failed
    try {
      const failStmt = env.DB.prepare(`
        UPDATE cloudflare_pending_scripts
        SET status = 'failed', executed_at = CURRENT_TIMESTAMP, result = ?
        WHERE id = ?
      `);
      
      await failStmt.bind(
        `Error: ${error.message}`,
        scriptId
      ).run();
    } catch (updateError) {
      console.error('Error updating script status:', updateError);
    }
    
    return {
      success: false,
      message: 'Failed to execute script'
    };
  }
}

// Main request handler
export default {
  async fetch(request, env, ctx) {
    // Enhanced logging for debugging
    console.log(`Request received: ${request.method} ${new URL(request.url).pathname}`);
    
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
        return corsResponse({ status: 'ok', message: 'Admin API worker is running' }, 200, request);
      }
      
      // All other routes require authentication and admin rights
      const token = parseToken(request);
      console.log(`Token present: ${!!token}`);
      
      if (!token) {
        return errorResponse('Unauthorized', 401, request);
      }
      
      const authInfo = await verifyAdminToken(token, env);
      
      if (!authInfo || !authInfo.isAdmin) {
        return errorResponse('Unauthorized - Admin access required', 403, request);
      }
      
      const userId = authInfo.userId;
      console.log(`Admin user ID: ${userId}`);
      
      // Route handlers
      switch (path) {
        case 'totp/status': {
          // Check if TOTP is set up for this user
          const stmt = env.DB.prepare(`
            SELECT EXISTS(SELECT 1 FROM admin_totp_secrets WHERE user_id = ? AND is_active = true) as isSetup
          `);
          
          const result = await stmt.bind(userId).first();
          return corsResponse({ isSetup: !!result?.isSetup }, 200, request);
        }
        
        case 'totp/verify': {
          // Verify TOTP code
          const { code } = await request.json();
          const result = await verifyTotp(userId, code, env);
          return corsResponse(result, 200, request);
        }
        
        case 'totp/generate-backup-codes': {
          // Generate backup codes
          const result = await generateBackupCodes(userId, env);
          return corsResponse(result, 200, request);
        }
        
        case 'admin/run-script': {
          // Run a wrangler script
          const { script } = await request.json();
          const result = await runWranglerScript(script, userId, env);
          return corsResponse(result, 200, request);
        }
        
        case 'admin/cloudflare-errors': {
          // Get Cloudflare errors
          const result = await getCloudflareErrors(env);
          return corsResponse(result, 200, request);
        }
        
        case 'admin/pending-scripts': {
          // Get pending scripts
          const result = await getPendingScripts(env);
          return corsResponse(result, 200, request);
        }
        
        case 'admin/update-error-status': {
          // Update error status
          const { errorId, status } = await request.json();
          const result = await updateErrorStatus(errorId, status, env);
          return corsResponse(result, 200, request);
        }
        
        case 'admin/execute-pending-script': {
          // Execute pending script
          const { scriptId } = await request.json();
          const result = await executePendingScript(scriptId, env);
          return corsResponse(result, 200, request);
        }
        
        default:
          return errorResponse('Not Found', 404, request);
      }
    } catch (error) {
      console.error('Worker error:', error);
      return errorResponse(error.message || 'Internal Server Error', 500, request);
    }
  }
};
