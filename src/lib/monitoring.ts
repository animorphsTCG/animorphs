/**
 * Enhanced monitoring utilities for tracking application performance
 */

interface PerformanceData {
  timestamp: number;
  duration: number;
  operation: string;
  success: boolean;
  metadata?: Record<string, any>;
}

interface RealtimeMetrics {
  connections: number;
  disconnections: number;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  lastError?: string;
  lastConnectionTime?: number;
  lastDisconnectionTime?: number;
}

// Expanded in-memory metrics storage
const metrics = {
  operations: [] as PerformanceData[],
  maxStoredMetrics: 1000,
  errorCount: 0,
  slowOperationsThreshold: 1000, // ms
  
  // Realtime specific metrics
  realtime: {
    connections: 0,
    disconnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    errors: 0,
    lastError: undefined as string | undefined,
    lastConnectionTime: undefined as number | undefined,
    lastDisconnectionTime: undefined as number | undefined,
    channelStats: new Map<string, RealtimeMetrics>()
  },
  
  // Add a new performance record
  record(data: PerformanceData): void {
    // Keep array at reasonable size
    if (this.operations.length >= this.maxStoredMetrics) {
      this.operations.shift();
    }
    
    this.operations.push(data);
    
    // Track error count
    if (!data.success) {
      this.errorCount++;
    }
    
    // Log slow operations
    if (data.duration > this.slowOperationsThreshold) {
      console.warn(`Slow operation detected: ${data.operation} took ${data.duration}ms`, data.metadata || {});
    }
  },
  
  // Track realtime connection events
  trackRealtimeConnection(channelId: string): void {
    this.realtime.connections++;
    this.realtime.lastConnectionTime = Date.now();
    
    // Update per-channel stats
    const channelStats = this.realtime.channelStats.get(channelId) || this.createEmptyChannelStats();
    channelStats.connections++;
    channelStats.lastConnectionTime = Date.now();
    this.realtime.channelStats.set(channelId, channelStats);
    
    // Log for monitoring
    console.log(`Realtime connection established for channel: ${channelId}`);
  },
  
  // Track realtime disconnection events
  trackRealtimeDisconnection(channelId: string, reason?: string): void {
    this.realtime.disconnections++;
    this.realtime.lastDisconnectionTime = Date.now();
    
    // Update per-channel stats
    const channelStats = this.realtime.channelStats.get(channelId) || this.createEmptyChannelStats();
    channelStats.disconnections++;
    channelStats.lastDisconnectionTime = Date.now();
    this.realtime.channelStats.set(channelId, channelStats);
    
    // Log for monitoring
    console.log(`Realtime disconnection for channel: ${channelId}${reason ? ` (${reason})` : ''}`);
  },
  
  // Track realtime message events
  trackRealtimeMessage(channelId: string, direction: 'sent' | 'received', messageType?: string): void {
    if (direction === 'sent') {
      this.realtime.messagesSent++;
    } else {
      this.realtime.messagesReceived++;
    }
    
    // Update per-channel stats
    const channelStats = this.realtime.channelStats.get(channelId) || this.createEmptyChannelStats();
    if (direction === 'sent') {
      channelStats.messagesSent++;
    } else {
      channelStats.messagesReceived++;
    }
    this.realtime.channelStats.set(channelId, channelStats);
  },
  
  // Track realtime errors
  trackRealtimeError(channelId: string, error: string): void {
    this.realtime.errors++;
    this.realtime.lastError = error;
    
    // Update per-channel stats
    const channelStats = this.realtime.channelStats.get(channelId) || this.createEmptyChannelStats();
    channelStats.errors++;
    channelStats.lastError = error;
    this.realtime.channelStats.set(channelId, channelStats);
    
    // Log for monitoring
    console.error(`Realtime error for channel: ${channelId} - ${error}`);
  },
  
  // Helper to create empty channel stats
  createEmptyChannelStats(): RealtimeMetrics {
    return {
      connections: 0,
      disconnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0
    };
  },
  
  // Get metrics summary
  getSummary(): Record<string, any> {
    if (this.operations.length === 0) return { count: 0, avgDuration: 0, errorRate: 0 };
    
    const total = this.operations.length;
    const totalDuration = this.operations.reduce((sum, op) => sum + op.duration, 0);
    const avgDuration = Math.round(totalDuration / total);
    const errorRate = (this.errorCount / total) * 100;
    
    // Group by operation type
    const operationTypes = new Map<string, { count: number, totalDuration: number, errors: number }>();
    
    this.operations.forEach(op => {
      const current = operationTypes.get(op.operation) || { count: 0, totalDuration: 0, errors: 0 };
      operationTypes.set(op.operation, {
        count: current.count + 1,
        totalDuration: current.totalDuration + op.duration,
        errors: current.errors + (op.success ? 0 : 1)
      });
    });
    
    // Format operation type stats
    const operationStats = Array.from(operationTypes.entries()).map(([type, stats]) => ({
      type,
      count: stats.count,
      avgDuration: Math.round(stats.totalDuration / stats.count),
      errorRate: (stats.errors / stats.count) * 100
    }));
    
    // Include realtime stats
    const realtimeStats = {
      connections: this.realtime.connections,
      disconnections: this.realtime.disconnections,
      messagesSent: this.realtime.messagesSent,
      messagesReceived: this.realtime.messagesReceived,
      errors: this.realtime.errors,
      channels: Array.from(this.realtime.channelStats.entries()).map(([channel, stats]) => ({
        channel,
        ...stats
      }))
    };
    
    return {
      total,
      avgDuration,
      errorRate,
      operations: operationStats,
      realtime: realtimeStats
    };
  },
  
  // Clear metrics
  clear(): void {
    this.operations = [];
    this.errorCount = 0;
    this.realtime = {
      connections: 0,
      disconnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      channelStats: new Map()
    };
  }
};

/**
 * Performance measurement decorator
 * @param operation Name of the operation being measured
 */
export function measure<T>(operation: string) {
  // Implementation that handles both function and method decorators
  return function(
    targetOrDescriptor: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor
  ) {
    // For function decorators
    if (typeof targetOrDescriptor === 'function') {
      return async function(...args: any[]) {
        const start = performance.now();
        let success = true;
        
        try {
          const result = await targetOrDescriptor.apply(this, args);
          return result;
        } catch (error) {
          success = false;
          throw error;
        } finally {
          const duration = performance.now() - start;
          
          // Record the performance data
          metrics.record({
            timestamp: Date.now(),
            duration,
            operation,
            success,
            metadata: { args: args.map(arg => typeof arg) }
          });
        }
      };
    }
    
    // For method decorators
    if (descriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args: any[]) {
        const start = performance.now();
        let success = true;
        
        try {
          const result = await originalMethod.apply(this, args);
          return result;
        } catch (error) {
          success = false;
          throw error;
        } finally {
          const duration = performance.now() - start;
          
          // Record the performance data
          metrics.record({
            timestamp: Date.now(),
            duration,
            operation,
            success,
            metadata: { args: args.map(arg => typeof arg) }
          });
        }
      };
      
      return descriptor;
    }
    
    return targetOrDescriptor;
  };
}

/**
 * Enhanced Supabase channel wrapper to track stats
 */
export function monitorChannel(channel: any, channelId: string) {
  // Original functions
  const originalSubscribe = channel.subscribe;
  const originalOn = channel.on;
  const originalSend = channel.send;
  
  // Override subscribe
  channel.subscribe = function(...args: any[]) {
    metrics.trackRealtimeConnection(channelId);
    return originalSubscribe.apply(this, args);
  };
  
  // Override on for message tracking
  channel.on = function(event: string, ...rest: any[]) {
    const originalHandler = rest[rest.length - 1];
    
    if (typeof originalHandler === 'function') {
      // Replace the handler with our own
      rest[rest.length - 1] = function(...handlerArgs: any[]) {
        metrics.trackRealtimeMessage(channelId, 'received', event);
        return originalHandler.apply(this, handlerArgs);
      };
    }
    
    return originalOn.apply(this, [event, ...rest]);
  };
  
  // Override send
  channel.send = function(...args: any[]) {
    metrics.trackRealtimeMessage(channelId, 'sent');
    return originalSend.apply(this, args);
  };
  
  return channel;
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics() {
  return metrics.getSummary();
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics() {
  metrics.clear();
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): Record<string, any> {
  // Browser memory API is only available in Chrome/Chromium browsers
  const memory = (performance as any).memory;
  
  if (memory) {
    return {
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      utilization: memory.usedJSHeapSize / memory.jsHeapSizeLimit
    };
  }
  
  // Fallback for browsers without memory API
  return {
    available: false,
    message: "Memory usage metrics not available in this browser"
  };
}

// Export the metrics object for testing
export { metrics };
