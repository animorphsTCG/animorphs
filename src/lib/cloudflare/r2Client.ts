
/**
 * R2 Client for accessing Cloudflare R2 storage
 */
import { toast } from "@/hooks/use-toast";

const R2_API_URL = "https://api.cloudflare.com/client/v4/accounts";

// Expected format for R2 object metadata
export interface R2ObjectMetadata {
  key: string;
  size: number;
  etag: string;
  uploaded: string; // ISO date string
  httpMetadata?: {
    contentType: string;
  };
  customMetadata?: Record<string, string>;
}

export interface R2BucketObject {
  name: string;
  size: number;
  lastModified: string;
  url: string;
  contentType: string;
  etag: string;
  metadata?: Record<string, string>;
}

export interface R2ClientConfig {
  accountId: string;
  bucketName: string;
  accessToken: string;
}

/**
 * Client for interacting with Cloudflare R2 storage
 */
export class R2Client {
  private accountId: string;
  private bucketName: string;
  public accessToken: string; // Made public to allow access in hooks
  private baseUrl: string;
  
  constructor(config: R2ClientConfig) {
    this.accountId = config.accountId;
    this.bucketName = config.bucketName;
    this.accessToken = config.accessToken;
    this.baseUrl = `${R2_API_URL}/${this.accountId}/r2/buckets/${this.bucketName}/objects`;
  }
  
  /**
   * List objects in the R2 bucket with optional prefix
   */
  async listObjects(prefix?: string, limit = 1000): Promise<R2BucketObject[]> {
    try {
      let url = this.baseUrl;
      const params = new URLSearchParams();
      
      if (prefix) params.append('prefix', prefix);
      if (limit) params.append('limit', limit.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error listing objects: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.result || !Array.isArray(data.result.objects)) {
        throw new Error('Invalid response format from R2 API');
      }
      
      return data.result.objects.map((obj: R2ObjectMetadata) => ({
        name: obj.key,
        size: obj.size,
        lastModified: obj.uploaded,
        url: this.getObjectUrl(obj.key),
        contentType: obj.httpMetadata?.contentType || 'application/octet-stream',
        etag: obj.etag,
        metadata: obj.customMetadata
      }));
    } catch (error) {
      console.error('Error listing R2 objects:', error);
      toast({
        title: "R2 Error",
        description: "Failed to list objects from R2 storage",
        variant: "destructive"
      });
      return [];
    }
  }
  
  /**
   * Get a single object from the R2 bucket
   */
  async getObject(key: string): Promise<Response | null> {
    try {
      const url = `${this.baseUrl}/${encodeURIComponent(key)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get object: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error('Error getting R2 object:', error);
      toast({
        title: "R2 Error",
        description: `Could not fetch ${key} from storage`,
        variant: "destructive"
      });
      return null;
    }
  }
  
  /**
   * Get a public URL for an object
   */
  getObjectUrl(key: string): string {
    return `https://${this.bucketName}.r2.dev/${encodeURIComponent(key)}`;
  }
  
  /**
   * Get object metadata
   */
  async getObjectMetadata(key: string): Promise<R2ObjectMetadata | null> {
    try {
      const url = `${this.baseUrl}/${encodeURIComponent(key)}?metadata=true`;
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get object metadata: ${response.status}`);
      }
      
      return {
        key,
        size: parseInt(response.headers.get('Content-Length') || '0'),
        etag: response.headers.get('ETag') || '',
        uploaded: response.headers.get('Last-Modified') || new Date().toISOString(),
        httpMetadata: {
          contentType: response.headers.get('Content-Type') || 'application/octet-stream'
        }
      };
    } catch (error) {
      console.error('Error getting R2 object metadata:', error);
      return null;
    }
  }
}

// Default instance for common use (will be configured with proper values later)
export const r2Client = new R2Client({
  accountId: "64fe315d69fd1b11c93a3a36449c5cc3",
  bucketName: "zypherdan",
  accessToken: "" // Will be set at runtime
});
