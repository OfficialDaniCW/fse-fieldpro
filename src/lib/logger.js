class Logger {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async log(level, category, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = { level, category, message, data, timestamp };

    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${category}] ${message}`, data);

    this.queue.push(logEntry);
    if (!this.isProcessing) this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    const batch = this.queue.splice(0, 10);

    try {
      for (const entry of batch) {
        try {
          await fetch('/api/invoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'logSystemEvent',
              data: {
                level: entry.level,
                category: entry.category,
                message: entry.message,
                data: JSON.stringify(entry.data),
                timestamp: entry.timestamp,
              },
            }),
          });
        } catch {}
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) setTimeout(() => this.processQueue(), 100);
    }
  }

  info(category, message, data) { this.log('info', category, message, data); }
  warn(category, message, data) { this.log('warn', category, message, data); }
  error(category, message, data) { this.log('error', category, message, data); }

  logApiCall(method, endpoint, status, responseTime, data) {
    this.log('info', 'API', `${method} ${endpoint} → ${status}`, { method, endpoint, status, responseTime: `${responseTime}ms`, ...data });
  }

  logUserAction(action, details) { this.log('info', 'USER_ACTION', action, details); }

  logError(category, error, context) {
    this.log('error', category, error.message || String(error), {
      error: error.toString(),
      stack: error.stack,
      ...context,
    });
  }
}

export const logger = new Logger();

window.addEventListener('error', (event) => {
  logger.logError('UNHANDLED_ERROR', event.error, { filename: event.filename, lineno: event.lineno });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.logError('UNHANDLED_PROMISE_REJECTION', event.reason, { promise: 'unhandled promise rejection' });
});
