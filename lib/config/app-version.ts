/**
 * App Version Configuration
 * 
 * Provides version information for tracking in Stripe metadata
 */

export const APP_VERSION = '0.1.0';

export function getAppVersion(): string {
  return process.env.npm_package_version || APP_VERSION;
}