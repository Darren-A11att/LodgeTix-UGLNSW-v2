// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isDevelopment = process.env.NODE_ENV === 'development';

Sentry.init({
  dsn: "https://1aac12975d22b96f04a640484ac4e5d7@o4509321609019392.ingest.us.sentry.io/4509321613606912",

  // Reduced trace sampling to prevent rate limiting (was 1.0 = 100%)
  tracesSampleRate: isDevelopment ? 0.05 : 0.1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
