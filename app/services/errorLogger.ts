interface ErrorLogEntry {
  timestamp: number;
  error: string;
  stack?: string;
  userAgent: string;
  url: string;
  userId?: string;
  context?: string;
}

class ErrorLogger {
  private maxLogs = 100;
  private storageKey = 'trustwallet_error_logs';

  logError(error: Error, context?: string, userId?: string) {
    const logEntry: ErrorLogEntry = {
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId,
      context,
    };

    this.saveErrorLog(logEntry);

    if (import.meta.env.DEV) {
      console.error('Error logged:', logEntry);
    }
  }

  logMessage(message: string, context?: string) {
    const error = new Error(message);
    this.logError(error, context);
  }

  private saveErrorLog(logEntry: ErrorLogEntry) {
    try {
      const existingLogs = this.getErrorLogs();
      const updatedLogs = [logEntry, ...existingLogs].slice(0, this.maxLogs);
      
      localStorage.setItem(this.storageKey, JSON.stringify(updatedLogs));
    } catch (storageError) {
      console.warn('Failed to save error log:', storageError);
    }
  }

  getErrorLogs(): ErrorLogEntry[] {
    try {
      const logs = localStorage.getItem(this.storageKey);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.warn('Failed to retrieve error logs:', error);
      return [];
    }
  }

  clearErrorLogs() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear error logs:', error);
    }
  }

  exportErrorLogs(): string {
    const logs = this.getErrorLogs();
    return JSON.stringify(logs, null, 2);
  }

  getRecentErrors(hours: number = 24): ErrorLogEntry[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.getErrorLogs().filter(log => log.timestamp > cutoffTime);
  }
}

export const errorLogger = new ErrorLogger();
