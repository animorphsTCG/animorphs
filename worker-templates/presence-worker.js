
// Cloudflare Presence Worker with Durable Object for state

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Define the Presence Durable Object
export class PresenceDO {
  constructor(state) {
    this.state = state;
    this.storage = state.storage;
    this.users = new Map();
    this.initialized = false;
  }

  // Initialize with stored data
  async initialize() {
    if (this.initialized) return;
    
    try {
      const storedUsers = await this.storage.get("users");
      if (storedUsers) {
        this.users = new Map(JSON.parse(storedUsers));
      }
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing presence DO:", error);
    }
  }

  // Handle requests
  async fetch(request) {
    await this.initialize();
    
    const url = new URL(request.url);
    const path = url.pathname.slice(url.pathname.lastIndexOf('/') + 1);
    
    if (request.method === "POST") {
      const data = await request.json();
      
      switch (path) {
        case "update":
          return await this.updatePresence(data);
        case "bulk-update":
          return await this.bulkUpdatePresence(data.users);
        case "cleanup":
          return await this.cleanupOfflineUsers(data.offlineThreshold || 5 * 60 * 1000); // 5 mins default
        default:
          return new Response(`Unknown POST method: ${path}`, { status: 400 });
      }
    } else if (request.method === "GET") {
      switch (path) {
        case "all":
          return await this.getAllUsers();
        case "online":
          return await this.getOnlineUsers();
        case "user":
          const userId = url.searchParams.get('id');
          return await this.getUserPresence(userId);
        default:
          return new Response(`Unknown GET method: ${path}`, { status: 400 });
      }
    }
    
    return new Response("Method not allowed", { status: 405 });
  }

  // Update a single user's presence
  async updatePresence(data) {
    if (!data.user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const now = Date.now();
    const lastSeen = new Date().toISOString();
    
    // Update or add user
    this.users.set(data.user_id, {
      ...data,
      last_ping: now,
      last_seen: lastSeen
    });

    // Store updated data
    await this.persistData();
    
    return new Response(JSON.stringify({ success: true }), { 
      headers: { "Content-Type": "application/json" }
    });
  }

  // Bulk update multiple users
  async bulkUpdatePresence(users) {
    if (!Array.isArray(users)) {
      return new Response(JSON.stringify({ error: "Invalid users array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const now = Date.now();
    const lastSeen = new Date().toISOString();
    
    for (const user of users) {
      if (user.user_id) {
        this.users.set(user.user_id, {
          ...user,
          last_ping: now,
          last_seen: lastSeen
        });
      }
    }
    
    await this.persistData();
    
    return new Response(JSON.stringify({ success: true, count: users.length }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Get all users (including offline)
  async getAllUsers() {
    return new Response(
      JSON.stringify({ users: Array.from(this.users.values()) }),
      { headers: { "Content-Type": "application/json" }}
    );
  }

  // Get online users only
  async getOnlineUsers() {
    const offlineThreshold = 2 * 60 * 1000; // 2 minutes
    const now = Date.now();
    
    const onlineUsers = Array.from(this.users.values()).filter(user => {
      return user.status !== 'offline' && 
             (now - user.last_ping) < offlineThreshold;
    });
    
    return new Response(
      JSON.stringify({ users: onlineUsers }),
      { headers: { "Content-Type": "application/json" }}
    );
  }

  // Get presence for a specific user
  async getUserPresence(userId) {
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing user ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const user = this.users.get(userId);
    
    return new Response(
      JSON.stringify({ user: user || null }),
      { headers: { "Content-Type": "application/json" }}
    );
  }

  // Clean up offline users that haven't been seen in a while
  async cleanupOfflineUsers(offlineThreshold) {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [userId, userData] of this.users.entries()) {
      if ((now - userData.last_ping) > offlineThreshold) {
        this.users.delete(userId);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      await this.persistData();
    }
    
    return new Response(
      JSON.stringify({ success: true, removed: removedCount }),
      { headers: { "Content-Type": "application/json" }}
    );
  }

  // Save the current state to storage
  async persistData() {
    await this.storage.put("users", JSON.stringify(Array.from(this.users.entries())));
  }
}

// Helper functions
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

// Main Worker handler
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
      // Skip auth check for health checks
      if (path !== 'health') {
        const token = parseToken(request);
        
        if (!token) {
          return errorResponse('Unauthorized', 401);
        }
        
        // In a real implementation, we would verify the token
        // For now, we assume it's valid
      }
      
      // Get the presence Durable Object
      const id = env.PRESENCE_DO.idFromName('global');
      const obj = env.PRESENCE_DO.get(id);
      
      // Route handlers
      switch (path) {
        case 'health':
          return corsResponse({ status: 'ok' });
          
        case 'presence':
          if (request.method === 'POST') {
            const data = await request.json();
            
            // Forward to Durable Object
            const response = await obj.fetch(new Request(
              `${url.origin}/do/update`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              }
            ));
            
            const result = await response.json();
            return corsResponse(result);
          }
          break;
          
        case 'online-users':
          // Forward to Durable Object
          const onlineResponse = await obj.fetch(`${url.origin}/do/online`);
          const onlineUsers = await onlineResponse.json();
          return corsResponse(onlineUsers);
          
        case 'users-presence':
          if (request.method === 'POST') {
            const { user_ids } = await request.json();
            
            if (!Array.isArray(user_ids) || user_ids.length === 0) {
              return errorResponse('Invalid user_ids array');
            }
            
            // Get all users first
            const allUsersResponse = await obj.fetch(`${url.origin}/do/all`);
            const { users } = await allUsersResponse.json();
            
            // Filter by requested IDs
            const presence = {};
            for (const user of users) {
              if (user_ids.includes(user.user_id)) {
                presence[user.user_id] = user;
              }
            }
            
            return corsResponse({ presence });
          }
          break;
          
        default:
          return errorResponse('Not Found', 404);
      }
      
      return errorResponse('Method not allowed', 405);
    } catch (error) {
      console.error('Worker error:', error);
      return errorResponse(error.message || 'Internal Server Error', 500);
    }
  }
};
