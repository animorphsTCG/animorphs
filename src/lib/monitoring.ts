/**
 * Monitoring utilities for tracking application performance
 */

interface PerformanceData {
  timestamp: number;
  duration: number;
  operation: string;
  success: boolean;
  metadata?: Record<string, any>;
}

// Simple in-memory metrics storage
const metrics = {
  operations: [] as PerformanceData[],
  maxStoredMetrics: 1000,
  errorCount: 0,
  slowOperationsThreshold: 1000, // ms
  
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
    
    return {
      total,
      avgDuration,
      errorRate,
      operations: operationStats
    };
  },
  
  // Clear metrics
  clear(): void {
    this.operations = [];
    this.errorCount = 0;
  }
};

/**
 * Performance measurement decorator
 * @param operation Name of the operation being measured
 */
export function measure<T>(operation: string) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
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
  };
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
