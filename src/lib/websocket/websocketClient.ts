
/**
 * WebSocket Client
 * 
 * Provides a client for interacting with the WebSocket API
 */

import { EOSAuthResponse } from '@/lib/eos/eosAuth';

// WebSocket message types
type MessageType = 
  | 'welcome'
  | 'error'
  | 'pong'
  | 'room_state'
  | 'presence_join'
  | 'presence_leave'
  | 'presence_update'
  | 'room_message'
  | 'direct_message';

// WebSocket message interface
interface WebSocketMessage {
  type: MessageType;
  [key: string]: any;
}

// Room State
interface RoomState {
  presences: PresenceData[];
}

// Presence Data
interface PresenceData {
  userId: string;
  roomName: string;
  metadata?: any;
  timestamp: number;
}

// Event callback
type EventCallback = (data: any) => void;

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private clientId: string | null = null;
  private userId: string | null = null;
  private connected: boolean = false;
  private reconnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  private pingInterval: number | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  
  constructor(token?: string) {
    if (token) {
      this.setToken(token);
    }
  }
  
  setToken(token: string): void {
    this.token = token;
    
    if (this.connected) {
      // Reconnect with new token
      this.disconnect();
      this.connect();
    }
  }
  
  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve(true);
        return;
      }
      
      try {
        const wsUrl = this.getWebSocketUrl();
        this.socket = new WebSocket(wsUrl);
        
        this.socket.addEventListener('open', () => {
          console.log('WebSocket connected');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.startPingInterval();
          resolve(true);
        });
        
        this.socket.addEventListener('message', (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });
        
        this.socket.addEventListener('close', () => {
          console.log('WebSocket closed');
          this.connected = false;
          this.stopPingInterval();
          this.handleDisconnect();
        });
        
        this.socket.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
          this.connected = false;
          this.stopPingInterval();
          reject(error);
        });
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }
  
  disconnect(): void {
    if (this.socket) {
      this.stopPingInterval();
      this.socket.close();
      this.socket = null;
      this.connected = false;
      this.clientId = null;
    }
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  joinRoom(roomName: string, metadata: any = {}): void {
    this.ensureConnected();
    
    this.send({
      type: 'join_room',
      room: roomName,
      metadata
    });
  }
  
  leaveRoom(roomName: string): void {
    this.ensureConnected();
    
    this.send({
      type: 'leave_room',
      room: roomName
    });
  }
  
  updatePresence(presence: any): void {
    this.ensureConnected();
    
    this.send({
      type: 'update_presence',
      presence
    });
  }
  
  sendRoomMessage(roomName: string, data: any): void {
    this.ensureConnected();
    
    this.send({
      type: 'room_message',
      room: roomName,
      data
    });
  }
  
  sendDirectMessage(targetUserId: string, data: any): void {
    this.ensureConnected();
    
    this.send({
      type: 'direct_message',
      targetUserId,
      data
    });
  }
  
  // Event listeners
  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
  }
  
  off(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    this.listeners.get(event)!.delete(callback);
  }
  
  // Private methods
  
  private getWebSocketUrl(): string {
    // Use appropriate worker URL based on environment
    const workerUrl = import.meta.env.VITE_WEBSOCKET_WORKER_URL || 'wss://websocket.mythicmasters.workers.dev';
    
    // Add token if available
    const url = new URL(workerUrl);
    if (this.token) {
      url.searchParams.set('token', this.token);
    }
    
    return url.toString();
  }
  
  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('WebSocket not connected');
    }
  }
  
  private send(data: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message, WebSocket not open');
      return;
    }
    
    try {
      this.socket.send(JSON.stringify(data));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }
  
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'welcome':
        this.clientId = message.clientId;
        this.userId = message.userId;
        this.emit('connected', { clientId: this.clientId, userId: this.userId });
        break;
        
      case 'room_state':
        this.emit('room_state', {
          room: message.room,
          state: message.state
        });
        break;
        
      case 'presence_join':
      case 'presence_leave':
      case 'presence_update':
        this.emit(message.type, {
          room: message.room,
          userId: message.userId,
          ...(message.type === 'presence_update' ? { presence: message.presence } : {}),
          ...(message.type === 'presence_join' ? { metadata: message.metadata } : {})
        });
        break;
        
      case 'room_message':
        this.emit('room_message', {
          room: message.room,
          senderId: message.senderId,
          data: message.data
        });
        break;
        
      case 'direct_message':
        this.emit('direct_message', {
          senderId: message.senderId,
          data: message.data
        });
        break;
        
      case 'error':
        console.error('WebSocket error:', message.message);
        this.emit('error', { message: message.message });
        break;
        
      case 'pong':
        // Ignored, handled by ping mechanism
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
    }
  }
  
  private handleDisconnect(): void {
    if (this.reconnecting) return;
    
    this.emit('disconnected', null);
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnecting = true;
      
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Reconnecting (attempt ${this.reconnectAttempts})...`);
        
        this.connect().then(() => {
          console.log('Reconnected successfully');
          this.reconnecting = false;
        }).catch(() => {
          console.error('Reconnection failed');
          this.reconnecting = false;
          this.handleDisconnect();
        });
      }, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts));
    } else {
      console.error('Maximum reconnection attempts reached');
    }
  }
  
  private startPingInterval(): void {
    this.stopPingInterval();
    
    this.pingInterval = window.setInterval(() => {
      if (this.connected) {
        this.send({ type: 'ping' });
      }
    }, 30000) as any; // Every 30 seconds
  }
  
  private stopPingInterval(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  private emit(event: string, data: any): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    for (const callback of this.listeners.get(event)!) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} event handler:`, error);
      }
    }
  }
}

// Export a singleton instance
export const websocketClient = new WebSocketClient();

// Helper function to initialize the client with a token
export const initializeWebSocketClient = (token: string): void => {
  websocketClient.setToken(token);
  websocketClient.connect().catch(error => {
    console.error('Failed to connect WebSocket client:', error);
  });
};

// Helper function to initialize WebSocket with EOS token
export const initializeWebSocketWithEOS = (eosAuth: EOSAuthResponse): void => {
  if (eosAuth && eosAuth.access_token) {
    initializeWebSocketClient(eosAuth.access_token);
  }
};
