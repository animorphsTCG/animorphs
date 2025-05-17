
/**
 * Helper functions for channel management
 */

export interface Subscription {
  unsubscribe: () => void;
}

export interface Channel {
  name: string;
  userId: string;
  subscribed: boolean;
  subscribe: () => Subscription;
  unsubscribe: () => Promise<boolean>;
  publish: (event: string, payload: any) => Promise<boolean>;
}

// Create a channel for real-time communication
export function createChannel(name: string, userId?: string): Channel {
  let isSubscribed = false;
  let activeSubscriptions: Subscription[] = [];
  
  const channel = {
    name,
    userId: userId || 'anonymous',
    get subscribed() { return isSubscribed; },
    
    subscribe: () => {
      console.log(`Subscribing to channel ${name} for user ${userId || 'anonymous'}`);
      isSubscribed = true;
      
      // Create subscription object
      const subscription = {
        unsubscribe: () => {
          console.log(`Unsubscribing from specific handler in channel ${name}`);
          const index = activeSubscriptions.indexOf(subscription);
          if (index !== -1) {
            activeSubscriptions.splice(index, 1);
          }
          isSubscribed = activeSubscriptions.length > 0;
        }
      };
      
      activeSubscriptions.push(subscription);
      return subscription;
    },
    
    unsubscribe: async () => {
      console.log(`Unsubscribing from channel ${name} for user ${userId || 'anonymous'}`);
      isSubscribed = false;
      
      // Clean up all subscriptions
      activeSubscriptions.forEach(sub => {
        try {
          sub.unsubscribe();
        } catch (e) {
          console.error('Error unsubscribing:', e);
        }
      });
      
      activeSubscriptions = [];
      return true;
    },
    
    publish: async (event: string, payload: any) => {
      console.log(`Publishing to channel ${name}, event: ${event}`, payload);
      // In a real implementation, this would use Durable Objects or similar
      return true;
    }
  };
  
  return channel;
}

// Create a channel with an event callback
export function createChannelWithCallback(
  name: string, 
  eventType: string,
  callback: (payload: any) => void,
  userId?: string
): { channel: Channel, subscription: Subscription } {
  const channel = createChannel(name, userId);
  
  // Create a real subscription
  const subscription = channel.subscribe();
  
  // In a real implementation, we would set up an event listener here
  console.log(`Created channel ${name} with listener for event ${eventType}`);
  
  return { channel, subscription };
}
