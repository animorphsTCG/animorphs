
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
    if (this.operations.length >= this.maxStoredMetrics) {
      this.operations.shift();
    }
    this.operations.push(data);
    if (!data.success) {
      this.errorCount++;
    }
    if (data.duration > this.slowOperationsThreshold) {
      console.warn(`Slow operation detected: ${data.operation} took ${data.duration}ms`, data.metadata || {});
    }
  },

  trackRealtimeConnection(channelId: string): void {
    this.realtime.connections++;
    this.realtime.lastConnectionTime = Date.now();

    const channelStats = this.realtime.channelStats.get(channelId) || this.createEmptyChannelStats();
    channelStats.connections++;
    channelStats.lastConnectionTime = Date.now();
    this.realtime.channelStats.set(channelId, channelStats);

    console.log(`Realtime connection established for channel: ${channelId}`);
  },

  trackRealtimeDisconnection(channelId: string, reason?: string): void {
    this.realtime.disconnections++;
    this.realtime.lastDisconnectionTime = Date.now();

    const channelStats = this.realtime.channelStats.get(channelId) || this.createEmptyChannelStats();
    channelStats.disconnections++;
    channelStats.lastDisconnectionTime = Date.now();
    this.realtime.channelStats.set(channelId, channelStats);

    console.log(`Realtime disconnection for channel: ${channelId}${reason ? ` (${reason})` : ''}`);
  },

  trackRealtimeMessage(channelId: string, direction: 'sent' | 'received', messageType?: string): void {
    if (direction === 'sent') {
      this.realtime.messagesSent++;
    } else {
      this.realtime.messagesReceived++;
    }

    const channelStats = this.realtime.channelStats.get(channelId) || this.createEmptyChannelStats();
    if (direction === 'sent') {
      channelStats.messagesSent++;
    } else {
      channelStats.messagesReceived++;
    }
    this.realtime.channelStats.set(channelId, channelStats);
  },

  trackRealtimeError(channelId: string, error: string): void {
    this.realtime.errors++;
    this.realtime.lastError = error;

    const channelStats = this.realtime.channelStats.get(channelId) || this.createEmptyChannelStats();
    channelStats.errors++;
    channelStats.lastError = error;
    this.realtime.channelStats.set(channelId, channelStats);

    console.error(`Realtime error for channel: ${channelId} - ${error}`);
  },

  createEmptyChannelStats(): RealtimeMetrics {
    return {
      connections: 0,
      disconnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0
    };
  },

  getSummary(): Record<string, any> {
    if (this.operations.length === 0) return { count: 0, avgDuration: 0, errorRate: 0 };

    const total = this.operations.length;
    const totalDuration = this.operations.reduce((sum, op) => sum + op.duration, 0);
    const avgDuration = Math.round(totalDuration / total);
    const errorRate = (this.errorCount / total) * 100;

    const operationTypes = new Map<string, { count: number; totalDuration: number; errors: number }>();

    this.operations.forEach(op => {
      const current = operationTypes.get(op.operation) || { count: 0, totalDuration: 0, errors: 0 };
      operationTypes.set(op.operation, {
        count: current.count + 1,
        totalDuration: current.totalDuration + op.duration,
        errors: current.errors + (op.success ? 0 : 1)
      });
    });

    const operationStats = Array.from(operationTypes.entries()).map(([type, stats]) => ({
      type,
      count: stats.count,
      avgDuration: Math.round(stats.totalDuration / stats.count),
      errorRate: (stats.errors / stats.count) * 100
    }));

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
  // Universal wrapper function for both direct function and decorator usage
  return function(targetOrDescriptor: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    // If called as a function decorator (@measure)
    if (typeof targetOrDescriptor === 'function' && propertyKey === undefined) {
      const fn = targetOrDescriptor;
      return async function (...args: any[]) {
        const start = performance.now();
        let success = true;
        try {
          const result = await fn.apply(this, args);
          return result;
        } catch (error) {
          success = false;
          throw error;
        } finally {
          const duration = performance.now() - start;
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

    // If called as a method decorator
    if (descriptor && typeof descriptor.value === 'function') {
      const originalMethod = descriptor.value;
      descriptor.value = async function (...args: any[]) {
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
  const originalSubscribe = channel.subscribe;
  const originalOn = channel.on;
  const originalSend = channel.send;

  channel.subscribe = function (...args: any[]) {
    metrics.trackRealtimeConnection(channelId);
    return originalSubscribe.apply(this, args);
  };

  channel.on = function (event: string, ...rest: any[]) {
    const originalHandler = rest[rest.length - 1];

    if (typeof originalHandler === 'function') {
      rest[rest.length - 1] = function (...handlerArgs: any[]) {
        metrics.trackRealtimeMessage(channelId, 'received', event);
        return originalHandler.apply(this, handlerArgs);
      };
    }

    return originalOn.apply(this, [event, ...rest]);
  };

  channel.send = function (...args: any[]) {
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
  const memory = (performance as any).memory;
  if (memory) {
    return {
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      utilization: memory.usedJSHeapSize / memory.jsHeapSizeLimit
    };
  }
  return {
    available: false,
    message: "Memory usage metrics not available in this browser"
  };
}

// Export the metrics object for testing
export { metrics };

