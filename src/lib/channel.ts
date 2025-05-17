
/**
 * Helper functions for channel management
 */

export interface Channel {
  name: string;
  userId: string;
  subscribed: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  publish: (event: string, payload: any) => Promise<boolean>;
}

// Create a channel for real-time communication
export function createChannel(name: string, userId: string): Channel {
  let isSubscribed = false;
  
  const channel = {
    name,
    userId,
    get subscribed() { return isSubscribed; },
    subscribe: async () => {
      console.log(`Subscribing to channel ${name} for user ${userId}`);
      isSubscribed = true;
      return true;
    },
    unsubscribe: async () => {
      console.log(`Unsubscribing from channel ${name} for user ${userId}`);
      isSubscribed = false;
      return true;
    },
    publish: async (event: string, payload: any) => {
      console.log(`Publishing to channel ${name}, event: ${event}`, payload);
      return true;
    }
  };
  
  return channel;
}
