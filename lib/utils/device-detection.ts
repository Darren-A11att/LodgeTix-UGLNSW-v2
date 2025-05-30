/**
 * Device Detection Utilities
 * 
 * Simple utilities for detecting device type from user agent
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Detect device type from user agent string
 */
export function detectDeviceType(userAgent: string | null): DeviceType {
  if (!userAgent) return 'desktop';
  
  const ua = userAgent.toLowerCase();
  
  // Check for mobile devices
  const mobileRegex = /android|webos|iphone|ipod|blackberry|windows phone/i;
  if (mobileRegex.test(ua)) {
    return 'mobile';
  }
  
  // Check for tablets
  const tabletRegex = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i;
  if (tabletRegex.test(ua)) {
    return 'tablet';
  }
  
  // Default to desktop
  return 'desktop';
}

/**
 * Get device type from request headers
 */
export function getDeviceTypeFromRequest(request: Request): DeviceType {
  const userAgent = request.headers.get('user-agent');
  return detectDeviceType(userAgent);
}

/**
 * Generate a session ID for tracking
 */
export function generateSessionId(): string {
  // Generate a random session ID
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `sess_${timestamp}_${randomStr}`;
}