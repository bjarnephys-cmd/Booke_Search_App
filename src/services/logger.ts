export interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
  details?: string;
  duration?: number;
}

type LogListener = (logs: LogEntry[]) => void;

class AppLogger {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();

  log(type: 'info' | 'success' | 'warn' | 'error', message: string, details?: string, duration?: number) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString('da-DK', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
      type,
      message,
      details,
      duration,
    };

    this.logs.unshift(entry);
    if (this.logs.length > 50) {
      this.logs.pop();
    }

    // Also call native console.log with styling
    const prefix = `[BogApp ${entry.time}]`;
    if (type === 'error') {
      console.error(prefix, message, details || '');
    } else if (type === 'warn') {
      console.warn(prefix, message, details || '');
    } else {
      console.log(prefix, message, details || '');
    }

    this.notify();
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.notify();
  }

  subscribe(listener: LogListener) {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const copy = [...this.logs];
    this.listeners.forEach((l) => l(copy));
  }
}

export const appLogger = new AppLogger();
