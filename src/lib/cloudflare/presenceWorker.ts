
/**
 * Cloudflare Presence Worker Client
 * Handles user presence tracking via Cloudflare Durable Objects
 */

// Configuration
const CF_PRESENCE_URL = 'https://presence.animorphs.workers.dev';

// Presence data interface
export interface UserPresence {
  user_id: string;
  username: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  profile_image_url?: string | null;
  has_paid: boolean;
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

// Presence worker methods
export const presenceWorker = {
  // Update user presence status
  async updatePresence(
    userId: string,
    status: 'online' | 'away' | 'busy' | 'offline',
    metadata: Record<string, any> = {},
    token: string
  ): Promise<void> {
    try {
      const response = await fetch(`${CF_PRESENCE_URL}/presence`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({
          user_id: userId,
          status,
          last_seen: new Date().toISOString(),
          metadata
        })
      });
      
      if (!response.ok) {
        throw new Error(`Presence update failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[Presence Worker] Error updating presence:', error);
      throw error;
    }
  },
  
  // Get online users
  async getOnlineUsers(token: string): Promise<UserPresence[]> {
    try {
      const response = await fetch(`${CF_PRESENCE_URL}/online-users`, {
        headers: getHeaders(token)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch online users: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('[Presence Worker] Error fetching online users:', error);
      throw error;
    }
  },
  
  // Get presence for specific users
  async getUsersPresence(userIds: string[], token: string): Promise<Record<string, UserPresence>> {
    try {
      const response = await fetch(`${CF_PRESENCE_URL}/users-presence`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({ user_ids: userIds })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users presence: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.presence || {};
    } catch (error) {
      console.error('[Presence Worker] Error fetching users presence:', error);
      throw error;
    }
  }
};
