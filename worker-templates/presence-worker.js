
// This is a template for a Cloudflare Worker with Durable Objects
// It would be deployed to Cloudflare using Wrangler

// Define the Presence Durable Object
export class PresenceDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.users = new Map();
  }

  // Initialize with stored data
  async initialize() {
    const stored = await this.state.storage.get("users");
    if (stored) {
      this.users = new Map(JSON.parse(stored));
    }
  }

  // Update user presence
  async updatePresence(userId, data) {
    await this.initialize();

    const lastSeen = new Date().toISOString();
    
    this.users.set(userId, {
      ...data,
      last_seen: lastSeen
    });

    // Store data
    await this.state.storage.put("users", JSON.stringify([...this.users]));
    
    return { success: true };
  }

  // Get all online users
  async getOnlineUsers() {
    await this.initialize();

    const twoMinutesAgo = new Date();
    twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);
    
    const onlineUsers = [];
    for (const [userId, userData] of this.users) {
      const lastSeen = new Date(userData.last_seen);
      if (lastSeen > twoMinutesAgo && userData.status !== 'offline') {
        onlineUsers.push({
          user_id: userId,
          ...userData
        });
      }
    }
    
    return onlineUsers;
  }
}

// Main Worker handler
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
      // Verify authentication
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
      
      // Get the presence Durable Object
      const id = env.PRESENCE_DO.idFromName('global');
      const presenceObj = env.PRESENCE_DO.get(id);
      
      // Routes
      if (url.pathname === '/presence' && request.method === 'POST') {
        // Update user presence
        const data = await request.json();
        const result = await presenceObj.fetch(request.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const responseData = await result.json();
        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (url.pathname === '/online-users' && request.method === 'GET') {
        // Get online users
        const result = await presenceObj.fetch(request.url);
        const users = await result.json();
        
        return new Response(JSON.stringify({ users }), {
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
