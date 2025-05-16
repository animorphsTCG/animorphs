
/**
 * Animorphs TCG WebSocket Worker
 * 
 * Handles real-time communication for the game
 */

// Map to store connected clients
const clients = new Map();
// Map to store active rooms
const rooms = new Map();

// User presence data
const userPresence = new Map();

// Handler for WebSocket connections
async function handleWebSocket(req) {
  const upgradeHeader = req.headers.get('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected websocket', { status: 400 });
  }

  // Extract auth token from URL or headers
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || req.headers.get('Authorization')?.split(' ')[1];
  
  // Create WebSocket pair
  const { 0: client, 1: server } = new WebSocketPair();
  
  // Accept the WebSocket connection
  server.accept();
  
  // Get client ID and user ID
  const clientId = crypto.randomUUID();
  let userId = null;
  
  // If token is provided, validate and get user ID
  if (token) {
    try {
      // In a real implementation, we'd verify the token
      // and extract the user ID from it
      // For now, we'll just use the token as the user ID
      userId = token;
    } catch (error) {
      server.send(JSON.stringify({
        type: 'error',
        message: 'Invalid authentication token'
      }));
    }
  }
  
  // Add client to map
  clients.set(clientId, {
    socket: server,
    userId,
    rooms: new Set(),
    lastPing: Date.now()
  });
  
  // Setup event handlers
  server.addEventListener('message', async (event) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'ping':
          handlePing(clientId);
          break;
          
        case 'join_room':
          handleJoinRoom(clientId, message.room, message.metadata);
          break;
          
        case 'leave_room':
          handleLeaveRoom(clientId, message.room);
          break;
          
        case 'update_presence':
          handleUpdatePresence(clientId, message.presence);
          break;
          
        case 'room_message':
          handleRoomMessage(clientId, message.room, message.data);
          break;
          
        case 'direct_message':
          handleDirectMessage(clientId, message.targetUserId, message.data);
          break;
          
        default:
          server.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      server.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  });
  
  server.addEventListener('close', () => {
    handleClientDisconnect(clientId);
  });
  
  server.addEventListener('error', () => {
    handleClientDisconnect(clientId);
  });
  
  // Send welcome message
  server.send(JSON.stringify({
    type: 'welcome',
    clientId,
    userId
  }));
  
  return new Response(null, {
    status: 101,
    webSocket: client
  });
}

// Handle ping message
function handlePing(clientId) {
  const client = clients.get(clientId);
  if (client) {
    client.lastPing = Date.now();
    client.socket.send(JSON.stringify({
      type: 'pong',
      timestamp: Date.now()
    }));
  }
}

// Handle join room
function handleJoinRoom(clientId, roomName, metadata = {}) {
  const client = clients.get(clientId);
  if (!client) return;
  
  // Create room if it doesn't exist
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set());
  }
  
  // Add client to room
  rooms.get(roomName).add(clientId);
  client.rooms.add(roomName);
  
  // Update user presence if authenticated
  if (client.userId) {
    const presenceData = {
      userId: client.userId,
      roomName,
      metadata,
      timestamp: Date.now()
    };
    
    // Store presence data
    if (!userPresence.has(client.userId)) {
      userPresence.set(client.userId, new Map());
    }
    userPresence.get(client.userId).set(roomName, presenceData);
    
    // Notify all clients in room about new presence
    broadcastToRoom(roomName, {
      type: 'presence_join',
      room: roomName,
      userId: client.userId,
      metadata
    }, clientId);
  }
  
  // Send room state to client
  const roomState = buildRoomState(roomName);
  client.socket.send(JSON.stringify({
    type: 'room_state',
    room: roomName,
    state: roomState
  }));
}

// Handle leave room
function handleLeaveRoom(clientId, roomName) {
  const client = clients.get(clientId);
  if (!client) return;
  
  // Remove client from room
  const room = rooms.get(roomName);
  if (room) {
    room.delete(clientId);
    
    // Delete room if empty
    if (room.size === 0) {
      rooms.delete(roomName);
    }
  }
  
  client.rooms.delete(roomName);
  
  // Update user presence if authenticated
  if (client.userId) {
    const userRooms = userPresence.get(client.userId);
    if (userRooms) {
      userRooms.delete(roomName);
      
      // Delete user presence if not in any rooms
      if (userRooms.size === 0) {
        userPresence.delete(client.userId);
      }
    }
    
    // Notify all clients in room about presence leave
    broadcastToRoom(roomName, {
      type: 'presence_leave',
      room: roomName,
      userId: client.userId
    }, clientId);
  }
}

// Handle update presence
function handleUpdatePresence(clientId, presence) {
  const client = clients.get(clientId);
  if (!client || !client.userId) return;
  
  // Update presence for each room the client is in
  for (const roomName of client.rooms) {
    if (!userPresence.has(client.userId)) {
      userPresence.set(client.userId, new Map());
    }
    
    const userRooms = userPresence.get(client.userId);
    const roomPresence = userRooms.get(roomName) || { userId: client.userId, roomName };
    
    // Update presence data
    const updatedPresence = {
      ...roomPresence,
      ...presence,
      timestamp: Date.now()
    };
    
    userRooms.set(roomName, updatedPresence);
    
    // Broadcast presence update to room
    broadcastToRoom(roomName, {
      type: 'presence_update',
      room: roomName,
      userId: client.userId,
      presence: updatedPresence
    }, clientId);
  }
}

// Handle room message
function handleRoomMessage(clientId, roomName, data) {
  const client = clients.get(clientId);
  if (!client) return;
  
  // Check if client is in room
  if (!client.rooms.has(roomName)) {
    client.socket.send(JSON.stringify({
      type: 'error',
      message: 'Not in room'
    }));
    return;
  }
  
  // Broadcast message to room
  broadcastToRoom(roomName, {
    type: 'room_message',
    room: roomName,
    senderId: client.userId || clientId,
    data
  }, clientId);
}

// Handle direct message
function handleDirectMessage(clientId, targetUserId, data) {
  const client = clients.get(clientId);
  if (!client) return;
  
  // Find target user's clients
  for (const [id, targetClient] of clients.entries()) {
    if (targetClient.userId === targetUserId) {
      targetClient.socket.send(JSON.stringify({
        type: 'direct_message',
        senderId: client.userId || clientId,
        data
      }));
    }
  }
}

// Handle client disconnect
function handleClientDisconnect(clientId) {
  const client = clients.get(clientId);
  if (!client) return;
  
  // Leave all rooms
  for (const roomName of client.rooms) {
    handleLeaveRoom(clientId, roomName);
  }
  
  // Remove client
  clients.delete(clientId);
}

// Broadcast message to all clients in a room
function broadcastToRoom(roomName, message, excludeClientId = null) {
  const room = rooms.get(roomName);
  if (!room) return;
  
  const messageStr = JSON.stringify(message);
  
  for (const clientId of room) {
    if (clientId !== excludeClientId) {
      const client = clients.get(clientId);
      if (client) {
        try {
          client.socket.send(messageStr);
        } catch (error) {
          console.error('Error sending message to client:', error);
        }
      }
    }
  }
}

// Build room state (presence information)
function buildRoomState(roomName) {
  const state = {
    presences: []
  };
  
  // Get all users in the room
  const room = rooms.get(roomName);
  if (room) {
    for (const clientId of room) {
      const client = clients.get(clientId);
      if (client && client.userId) {
        const userRooms = userPresence.get(client.userId);
        if (userRooms) {
          const presence = userRooms.get(roomName);
          if (presence) {
            state.presences.push(presence);
          }
        }
      }
    }
  }
  
  return state;
}

// Periodically clean up inactive clients
function cleanupInactiveClients() {
  const now = Date.now();
  const timeout = 60000; // 1 minute
  
  for (const [clientId, client] of clients.entries()) {
    if (now - client.lastPing > timeout) {
      handleClientDisconnect(clientId);
    }
  }
}

// Set up interval to clean up inactive clients
setInterval(cleanupInactiveClients, 30000); // Every 30 seconds

// Main event handler
addEventListener('fetch', (event) => {
  if (event.request.headers.get('Upgrade') === 'websocket') {
    event.respondWith(handleWebSocket(event.request));
  } else {
    event.respondWith(new Response('Expected websocket', { status: 400 }));
  }
});
