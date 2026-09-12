type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry = { level, message, timestamp: new Date().toISOString(), ...(context ? { context } : {}) };
  if (level === 'error') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}
