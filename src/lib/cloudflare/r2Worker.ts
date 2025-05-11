
/**
 * Cloudflare R2 Storage Worker Client
 * Handles asset storage operations via Cloudflare R2
 */

// Configuration
const CF_R2_URL = 'https://assets.animorphs.workers.dev';

// Upload options
export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  publicAccess?: boolean;
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

// Helper for creating multipart form data
const createFormData = (file: File, options?: UploadOptions) => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (options?.publicAccess !== undefined) {
    formData.append('public', options.publicAccess.toString());
  }
  
  if (options?.metadata) {
    formData.append('metadata', JSON.stringify(options.metadata));
  }
  
  return formData;
};

// R2 storage worker methods
export const r2Worker = {
  // Upload a file
  async uploadFile(
    bucket: string,
    path: string,
    file: File,
    token: string,
    options?: UploadOptions
  ): Promise<string> {
    try {
      const formData = createFormData(file, options);
      
      const response = await fetch(`${CF_R2_URL}/upload/${bucket}/${path}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Upload failed with status ${response.status}`);
      }
      
      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('[R2 Worker] Upload error:', error);
      throw error;
    }
  },
  
  // Delete a file
  async deleteFile(bucket: string, path: string, token: string): Promise<boolean> {
    try {
      const response = await fetch(`${CF_R2_URL}/delete/${bucket}/${path}`, {
        method: 'DELETE',
        headers: getHeaders(token)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Delete failed with status ${response.status}`);
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('[R2 Worker] Delete error:', error);
      throw error;
    }
  },
  
  // Get a presigned URL for direct upload
  async getPresignedUrl(
    bucket: string,
    path: string,
    contentType: string,
    token: string,
    expiresIn: number = 600 // 10 minutes
  ): Promise<string> {
    try {
      const response = await fetch(`${CF_R2_URL}/presigned-url`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({
          bucket,
          path,
          contentType,
          expiresIn
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to get presigned URL: ${response.status}`);
      }
      
      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('[R2 Worker] Presigned URL error:', error);
      throw error;
    }
  },
  
  // List files in a bucket/directory
  async listFiles(
    bucket: string,
    prefix?: string,
    token?: string
  ): Promise<Array<{name: string, size: number, lastModified: string}>> {
    try {
      const url = new URL(`${CF_R2_URL}/list/${bucket}`);
      if (prefix) {
        url.searchParams.append('prefix', prefix);
      }
      
      const response = await fetch(url.toString(), {
        headers: getHeaders(token)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `List failed with status ${response.status}`);
      }
      
      const result = await response.json();
      return result.objects || [];
    } catch (error) {
      console.error('[R2 Worker] List error:', error);
      throw error;
    }
  },
  
  // Get a public URL for a file (if the bucket is public)
  getPublicUrl(bucket: string, path: string): string {
    return `${CF_R2_URL}/public/${bucket}/${path}`;
  }
};
