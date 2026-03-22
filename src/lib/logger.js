import { base44 } from '@/api/base44Client';

class Logger {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async log(level, category, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = { level, category, message, data, timestamp };

    // Always log to console
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${category}] ${message}`, data);

    // Queue to database
    this.queue.push(logEntry);
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    const batch = this.queue.splice(0, 10); // Process in batches of 10

    try {
      for (const entry of batch) {
        try {
          await base44.functions.invoke('logSystemEvent', {
            level: entry.level,
            category: entry.category,
            message: entry.message,
            data: JSON.stringify(entry.data),
            timestamp: entry.timestamp
          });
        } catch (err) {
          console.error('Failed to log to database:', err);
        }
      }
    } finally {
      this.isProcessing = false;
      // Continue processing if there are more entries
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  info(category, message, data) {
    this.log('info', category, message, data);
  }

  warn(category, message, data) {
    this.log('warn', category, message, data);
  }

  error(category, message, data) {
    this.log('error', category, message, data);
  }

  // Log API calls
  logApiCall(method, endpoint, status, responseTime, data) {
    this.log('info', 'API', `${method} ${endpoint} → ${status}`, {
      method,
      endpoint,
      status,
      responseTime: `${responseTime}ms`,
      ...data
    });
  }

  // Log user actions
  logUserAction(action, details) {
    this.log('info', 'USER_ACTION', action, details);
  }

  // Log errors
  logError(category, error, context) {
    this.log('error', category, error.message || String(error), {
      error: error.toString(),
      stack: error.stack,
      ...context
    });
  }
}

export const logger = new Logger();

// Global error handler
window.addEventListener('error', (event) => {
  logger.logError('UNHANDLED_ERROR', event.error, {
    filename: event.filename,
    lineno: event.lineno
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.logError('UNHANDLED_PROMISE_REJECTION', event.reason, {
    promise: 'unhandled promise rejection'
  });
});