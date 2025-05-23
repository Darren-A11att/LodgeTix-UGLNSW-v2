/**
 * API logging utility that provides standardized logging for API requests and responses
 */

// Global log level setting
// Levels: 0 = silent, 1 = error, 2 = warn, 3 = info, 4 = debug
const LOG_LEVEL = process.env.NEXT_PUBLIC_LOG_LEVEL ? parseInt(process.env.NEXT_PUBLIC_LOG_LEVEL) : 3;

/**
 * Pretty formats an object for console output with custom indentation
 */
export function prettyFormat(obj: any, indent: number = 2): string {
  return JSON.stringify(obj, null, indent);
}

/**
 * Interface for request logging options
 */
interface RequestLogOptions {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  additionalInfo?: Record<string, any>;
}

/**
 * Interface for response logging options
 */
interface ResponseLogOptions {
  url: string;
  method: string;
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: any;
  duration?: number;
  additionalInfo?: Record<string, any>;
}

/**
 * API Logger utility for consistent logging
 */
export const api = {
  /**
   * Log error messages (level 1)
   */
  error: (message: string, ...args: any[]): void => {
    if (LOG_LEVEL >= 1) {
      console.error(`❌ ERROR: ${message}`, ...args);
    }
  },
  
  /**
   * Log warning messages (level 2)
   */
  warn: (message: string, ...args: any[]): void => {
    if (LOG_LEVEL >= 2) {
      console.warn(`⚠️ WARNING: ${message}`, ...args);
    }
  },
  
  /**
   * Log informational messages (level 3)
   */
  info: (message: string, ...args: any[]): void => {
    if (LOG_LEVEL >= 3) {
      console.info(`ℹ️ INFO: ${message}`, ...args);
    }
  },
  
  /**
   * Log debug messages (level 4)
   */
  debug: (message: string, ...args: any[]): void => {
    if (LOG_LEVEL >= 4) {
      console.debug(`🔍 DEBUG: ${message}`, ...args);
    }
  }
};

/**
 * Logs API request details
 */
export function logApiRequest(options: RequestLogOptions): void {
  if (LOG_LEVEL < 3) return;
  
  const { url, method, headers, body, additionalInfo } = options;
  
  console.group(`🔼 API Request: ${method} ${url}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  if (headers) {
    console.log(`Headers: ${prettyFormat(headers)}`);
  }
  
  if (body) {
    console.log(`Payload: ${prettyFormat(body)}`);
  }
  
  if (additionalInfo) {
    console.log(`Additional Info: ${prettyFormat(additionalInfo)}`);
  }
  
  console.groupEnd();
}

/**
 * Logs API response details
 */
export function logApiResponse(options: ResponseLogOptions): void {
  if (LOG_LEVEL < 3) return;
  
  const { url, method, status, statusText, headers, body, duration, additionalInfo } = options;
  
  // Use different icons based on response status
  let statusIcon = '✅'; // Success
  
  if (status >= 400) {
    statusIcon = '❌'; // Error
  } else if (status >= 300) {
    statusIcon = '↪️'; // Redirect
  }
  
  console.group(`🔽 API Response: ${statusIcon} ${method} ${url} (${status}${statusText ? ' ' + statusText : ''})`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  if (duration !== undefined) {
    console.log(`Duration: ${duration}ms`);
  }
  
  if (headers) {
    console.log(`Headers: ${prettyFormat(headers)}`);
  }
  
  if (body !== undefined) {
    console.log(`Response: ${prettyFormat(body)}`);
  }
  
  if (additionalInfo) {
    console.log(`Additional Info: ${prettyFormat(additionalInfo)}`);
  }
  
  console.groupEnd();
}

/**
 * Wraps a fetch call with logging
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns Promise resolving to the fetch response
 */
export async function loggedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const startTime = performance.now();
  const method = options.method || 'GET';
  
  // Clone the request body for logging if it exists
  let requestBody = undefined;
  if (options.body) {
    try {
      if (typeof options.body === 'string') {
        try {
          if (options.body !== 'undefined') {
            requestBody = JSON.parse(options.body);
          } else {
            requestBody = undefined;
          }
        } catch (parseError) {
          // If parsing fails, just use the original body string
          requestBody = options.body;
        }
      } else if (options.body instanceof FormData) {
        requestBody = '[FormData]';
      } else {
        requestBody = options.body;
      }
    } catch (e) {
      requestBody = options.body;
    }
  }
  
  // Log request
  logApiRequest({
    url,
    method,
    headers: options.headers as Record<string, string>,
    body: requestBody
  });
  
  try {
    // Perform the fetch
    const response = await fetch(url, options);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    // Clone the response to avoid locking it
    const clonedResponse = response.clone();
    
    // Try to parse response as JSON or text
    let responseBody;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseBody = await clonedResponse.json();
      } else {
        responseBody = await clonedResponse.text();
        if (responseBody.length > 1000) {
          responseBody = responseBody.substring(0, 1000) + '... [truncated]';
        }
      }
    } catch (e) {
      responseBody = '[Could not parse response body]';
    }
    
    // Log response
    logApiResponse({
      url,
      method,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody,
      duration
    });
    
    return response;
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    // Log error
    console.group(`❌ API Error: ${method} ${url}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Duration: ${duration}ms`);
    console.error(error);
    console.groupEnd();
    
    throw error;
  }
}