# Immutable Logging Laws

## Core Principles

These are the non-negotiable logging laws that MUST be followed in all Next.js development:

### Law 1: Structured Logging Only
- **ALL** logs must be structured JSON
- Use consistent field names across the application
- Include contextual metadata in every log
- Never use console.log in production code

### Law 2: Security First
- **NEVER** log sensitive information (passwords, tokens, PII)
- Sanitize user input before logging
- Mask or redact sensitive fields
- Follow GDPR/privacy requirements

### Law 3: Contextual Information
- Include request ID for tracing
- Add user ID (anonymized) for debugging
- Log environment and deployment information
- Maintain correlation IDs across services

### Law 4: Performance Considerate
- Use appropriate log levels
- Implement log sampling for high-volume events
- Asynchronous logging for non-critical paths
- Buffer logs to prevent blocking

### Law 5: Actionable Logs
- Every ERROR log must be actionable
- Include remediation steps where possible
- Avoid noise and redundant logging
- Make logs searchable and filterable

### Law 6: Consistent Format
- Standardize timestamp format (ISO 8601)
- Use consistent severity levels
- Maintain uniform error structure
- Include stack traces for errors

### Law 7: Environment Awareness
- Different log levels per environment
- Development logs can be verbose
- Production logs must be optimized
- Staging mirrors production settings

### Law 8: Retention Policies
- Define log retention periods
- Implement log rotation strategies
- Archive important logs
- Comply with data regulations

### Law 9: Monitoring Integration
- Logs must be monitorable
- Set up alerts for critical errors
- Track error rates and patterns
- Enable real-time log analysis

### Law 10: Client-Side Logging
- Implement client error collection
- Batch client logs before sending
- Respect user privacy settings
- Handle offline scenarios

## Implementation Patterns

### Logger Configuration
```typescript
// lib/logger/index.ts
import winston from 'winston';

interface LogContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  environment: string;
  service: string;
  version: string;
}

class Logger {
  private winston: winston.Logger;
  private context: LogContext;
  
  constructor(context: Partial<LogContext> = {}) {
    this.context = {
      environment: process.env.NODE_ENV || 'development',
      service: 'lodgetix-web',
      version: process.env.APP_VERSION || '0.0.0',
      ...context,
    };
    
    this.winston = winston.createLogger({
      level: this.getLogLevel(),
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: this.context,
      transports: this.getTransports(),
    });
  }
  
  private getLogLevel(): string {
    if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
    
    switch (process.env.NODE_ENV) {
      case 'production': return 'error';
      case 'staging': return 'warn';
      case 'development': return 'debug';
      default: return 'info';
    }
  }
  
  private getTransports(): winston.transport[] {
    const transports: winston.transport[] = [];
    
    if (process.env.NODE_ENV === 'development') {
      transports.push(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }));
    } else {
      transports.push(new winston.transports.Console());
      
      // Add external logging service
      if (process.env.DATADOG_API_KEY) {
        transports.push(new DatadogTransport({
          apiKey: process.env.DATADOG_API_KEY,
          service: this.context.service,
        }));
      }
    }
    
    return transports;
  }
  
  // Logging methods
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.winston.error(message, {
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
      ...metadata,
    });
  }
  
  warn(message: string, metadata?: Record<string, any>): void {
    this.winston.warn(message, metadata);
  }
  
  info(message: string, metadata?: Record<string, any>): void {
    this.winston.info(message, metadata);
  }
  
  debug(message: string, metadata?: Record<string, any>): void {
    this.winston.debug(message, metadata);
  }
  
  // Child logger with additional context
  child(context: Partial<LogContext>): Logger {
    return new Logger({ ...this.context, ...context });
  }
}

// Export singleton for server-side
export const logger = new Logger();

// Export factory for creating contextual loggers
export function createLogger(context?: Partial<LogContext>): Logger {
  return new Logger(context);
}
```

### Request Logging Middleware
```typescript
// middleware/logging.ts
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export function loggingMiddleware(request: NextRequest) {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  // Add request ID to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  
  // Log request
  logger.info('Incoming request', {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: request.ip,
  });
  
  // Create response with timing
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Log response
  const duration = Date.now() - startTime;
  logger.info('Request completed', {
    requestId,
    statusCode: response.status,
    duration,
  });
  
  response.headers.set('x-request-id', requestId);
  return response;
}
```

### API Route Logging
```typescript
// lib/api/withLogging.ts
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';

export function withLogging(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    const startTime = Date.now();
    
    // Create contextual logger
    const contextLogger = logger.child({
      requestId,
      userId: req.session?.userId,
      method: req.method,
      path: req.url,
    });
    
    // Attach logger to request for use in handler
    (req as any).logger = contextLogger;
    
    contextLogger.info('API request started');
    
    // Capture response
    const originalJson = res.json;
    res.json = function(body: any) {
      const duration = Date.now() - startTime;
      
      contextLogger.info('API request completed', {
        statusCode: res.statusCode,
        duration,
        responseSize: JSON.stringify(body).length,
      });
      
      return originalJson.call(this, body);
    };
    
    try {
      await handler(req, res);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      contextLogger.error('API request failed', error as Error, {
        statusCode: res.statusCode || 500,
        duration,
      });
      
      throw error;
    }
  };
}

// Usage
export default withLogging(async (req, res) => {
  req.logger.info('Processing user request');
  
  // Handler logic
  res.json({ success: true });
});
```

### Client-Side Logging
```typescript
// lib/logger/client.ts
interface ClientLogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

class ClientLogger {
  private queue: ClientLogEntry[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds
  private endpoint = '/api/logs';
  
  constructor() {
    // Set up automatic flushing
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), this.flushInterval);
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush());
      
      // Capture global errors
      window.addEventListener('error', (event) => {
        this.error('Uncaught error', new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });
      
      // Capture unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection', 
          new Error(event.reason), 
          { promise: event.promise }
        );
      });
    }
  }
  
  private log(
    level: ClientLogEntry['level'],
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): void {
    const entry: ClientLogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.getSessionId(),
      },
    };
    
    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
      };
    }
    
    this.queue.push(entry);
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }
  
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('error', message, metadata, error);
  }
  
  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }
  
  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }
  
  debug(message: string, metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, metadata);
    }
  }
  
  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: batch }),
      });
    } catch (error) {
      // Put logs back in queue on failure
      this.queue.unshift(...batch);
      console.error('Failed to send logs:', error);
    }
  }
  
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }
}

export const clientLogger = new ClientLogger();
```

### Sensitive Data Filtering
```typescript
// lib/logger/sanitizer.ts
interface SanitizationRule {
  field: string | RegExp;
  action: 'remove' | 'mask' | 'hash';
}

class LogSanitizer {
  private rules: SanitizationRule[] = [
    { field: 'password', action: 'remove' },
    { field: 'token', action: 'mask' },
    { field: 'apiKey', action: 'mask' },
    { field: /credit/i, action: 'mask' },
    { field: 'ssn', action: 'hash' },
    { field: 'email', action: 'mask' },
  ];
  
  sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }
    
    const sanitized = { ...data };
    
    for (const [key, value] of Object.entries(sanitized)) {
      const rule = this.findRule(key);
      
      if (rule) {
        switch (rule.action) {
          case 'remove':
            delete sanitized[key];
            break;
          case 'mask':
            sanitized[key] = this.mask(String(value));
            break;
          case 'hash':
            sanitized[key] = this.hash(String(value));
            break;
        }
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitize(value);
      }
    }
    
    return sanitized;
  }
  
  private findRule(field: string): SanitizationRule | undefined {
    return this.rules.find(rule => {
      if (typeof rule.field === 'string') {
        return rule.field === field;
      }
      return rule.field.test(field);
    });
  }
  
  private mask(value: string): string {
    if (value.length <= 4) return '****';
    return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
  }
  
  private hash(value: string): string {
    // Use a proper hashing function in production
    return 'hash:' + btoa(value).slice(0, 8);
  }
}

export const sanitizer = new LogSanitizer();
```

### Performance Monitoring
```typescript
// lib/logger/performance.ts
export function logPerformance(name: string, fn: () => any): any {
  const start = performance.now();
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        logger.info(`Performance: ${name}`, { duration, async: true });
      });
    }
    
    const duration = performance.now() - start;
    logger.info(`Performance: ${name}`, { duration, async: false });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(`Performance: ${name} failed`, error as Error, { duration });
    throw error;
  }
}

// Decorator for class methods
export function LogPerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function (...args: any[]) {
    return logPerformance(`${target.constructor.name}.${propertyKey}`, () => {
      return originalMethod.apply(this, args);
    });
  };
  
  return descriptor;
}
```

## Enforcement

These laws are enforced through:
1. ESLint rules (no-console)
2. TypeScript types for log structure
3. Code review checklist
4. Automated log analysis
5. Security scanning for PII in logs

## References

- [winston Documentation](https://github.com/winstonjs/winston)
- [Structured Logging Best Practices](https://www.datadoghq.com/blog/structured-logging/)
- [OWASP Logging Guide](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)