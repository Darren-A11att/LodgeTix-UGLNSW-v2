// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isDevelopment = process.env.NODE_ENV === 'development';

Sentry.init({
  dsn: "https://1aac12975d22b96f04a640484ac4e5d7@o4509321609019392.ingest.us.sentry.io/4509321613606912",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Reduced trace sampling to prevent rate limiting (was 1.0 = 100%)
  tracesSampleRate: isDevelopment ? 0.05 : 0.1,

  // Significantly reduced replay session sampling to prevent rate limiting
  // Development: 1% of sessions, Production: 2% of sessions (was 10%)
  replaysSessionSampleRate: isDevelopment ? 0.01 : 0.02,

  // Keep error replay sampling high for debugging critical issues
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;