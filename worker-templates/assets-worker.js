
/**
 * Cloudflare Worker for R2 asset storage
 * Handles file uploads, downloads, and management
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

// Handle file upload
async function handleUpload(request, env) {
  try {
    // Verify authentication
    await verifyAuth(request);
    
    // Parse the URL to get bucket and path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Path should be: /upload/{bucketName}/{filePath...}
    if (pathParts.length < 3 || pathParts[0] !== 'upload') {
      return new Response('Invalid URL format', { status: 400, headers: corsHeaders });
    }
    
    const bucketName = pathParts[1];
    const filePath = pathParts.slice(2).join('/');
    
    // Get the appropriate R2 bucket
    const bucket = env.ASSETS;
    
    // Check if the request body is a FormData
    if (request.headers.get('Content-Type')?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const metadata = formData.get('metadata');
      
      if (!file || !(file instanceof File)) {
        return new Response('Missing or invalid file', { status: 400, headers: corsHeaders });
      }
      
      // Parse metadata if provided
      const metadataObj = metadata ? JSON.parse(metadata) : {};
      
      // Upload to R2
      await bucket.put(
        `${bucketName}/${filePath}`, 
        await file.arrayBuffer(),
        {
          httpMetadata: {
            contentType: file.type,
          },
          customMetadata: metadataObj
        }
      );
      
      // Construct a public URL
      const publicUrl = `${url.origin}/public/${bucketName}/${filePath}`;
      
      return new Response(
        JSON.stringify({ success: true, url: publicUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Handle raw file upload
      await bucket.put(
        `${bucketName}/${filePath}`, 
        request.body,
        {
          httpMetadata: {
            contentType: request.headers.get('Content-Type') || 'application/octet-stream',
          }
        }
      );
      
      const publicUrl = `${url.origin}/public/${bucketName}/${filePath}`;
      
      return new Response(
        JSON.stringify({ success: true, url: publicUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to upload file' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Handle file deletion
async function handleDelete(request, env) {
  try {
    // Verify authentication
    await verifyAuth(request);
    
    // Parse the URL to get bucket and path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Path should be: /delete/{bucketName}/{filePath...}
    if (pathParts.length < 3 || pathParts[0] !== 'delete') {
      return new Response('Invalid URL format', { status: 400, headers: corsHeaders });
    }
    
    const bucketName = pathParts[1];
    const filePath = pathParts.slice(2).join('/');
    
    // Get the appropriate R2 bucket
    const bucket = env.ASSETS;
    
    // Delete the file
    await bucket.delete(`${bucketName}/${filePath}`);
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete file' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Handle file listing
async function handleList(request, env) {
  try {
    // Verify authentication
    await verifyAuth(request);
    
    // Parse the URL to get bucket
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Path should be: /list/{bucketName}
    if (pathParts.length < 2 || pathParts[0] !== 'list') {
      return new Response('Invalid URL format', { status: 400, headers: corsHeaders });
    }
    
    const bucketName = pathParts[1];
    const prefix = url.searchParams.get('prefix') || '';
    
    // Get the appropriate R2 bucket
    const bucket = env.ASSETS;
    
    // List objects with the provided prefix
    const listed = await bucket.list({
      prefix: `${bucketName}/${prefix}`,
      delimiter: '/'
    });
    
    // Format response
    const objects = listed.objects.map(obj => {
      // Remove bucket prefix from keys
      const key = obj.key.replace(`${bucketName}/`, '');
      
      return {
        name: key,
        size: obj.size,
        lastModified: obj.uploaded.toISOString()
      };
    });
    
    return new Response(
      JSON.stringify({ objects }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to list files' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Handle presigned URL generation
async function handlePresignedUrl(request, env) {
  try {
    // Verify authentication
    await verifyAuth(request);
    
    // Parse request body
    const { bucket: bucketName, path, contentType, expiresIn } = await request.json();
    
    if (!bucketName || !path) {
      return new Response('Missing bucket or path', { status: 400, headers: corsHeaders });
    }
    
    // Get the appropriate R2 bucket
    const bucket = env.ASSETS;
    
    // Generate a presigned URL (Note: Workers don't natively support presigned URLs,
    // this is a simplified approach)
    const url = new URL(request.url);
    const publicUrl = `${url.origin}/upload/${bucketName}/${path}`;
    
    // In a real implementation, this would create a secure signed URL
    // For now, we're just returning a regular URL
    return new Response(
      JSON.stringify({ url: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate presigned URL' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Handle public file access
async function handlePublicAccess(request, env) {
  try {
    // Parse the URL to get bucket and path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Path should be: /public/{bucketName}/{filePath...}
    if (pathParts.length < 3 || pathParts[0] !== 'public') {
      return new Response('Invalid URL format', { status: 400, headers: corsHeaders });
    }
    
    const bucketName = pathParts[1];
    const filePath = pathParts.slice(2).join('/');
    
    // Get the appropriate R2 bucket
    const bucket = env.ASSETS;
    
    // Get object from R2
    const object = await bucket.get(`${bucketName}/${filePath}`);
    
    if (!object) {
      return new Response('File not found', { status: 404, headers: corsHeaders });
    }
    
    // Return the file with appropriate content type
    const headers = new Headers(corsHeaders);
    headers.set('Content-Type', object.httpMetadata.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    return new Response(object.body, { headers });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to access file' }),
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
      if (path.startsWith('/upload/')) {
        return handleUpload(request, env);
      } else if (path.startsWith('/delete/')) {
        return handleDelete(request, env);
      } else if (path.startsWith('/list/')) {
        return handleList(request, env);
      } else if (path === '/presigned-url') {
        return handlePresignedUrl(request, env);
      } else if (path.startsWith('/public/')) {
        return handlePublicAccess(request, env);
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
