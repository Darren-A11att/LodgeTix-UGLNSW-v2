import {withSentryConfig} from '@sentry/nextjs';
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable Fast Refresh console messages
  reactStrictMode: false,
  devIndicators: {
    position: 'bottom-right',
  },
  // Disable client console messages for Fast Refresh
  onDemandEntries: {
    // Keep the build page in memory for this many ms (defaults to 60000)
    maxInactiveAge: 60 * 1000,
    // Number of pages that should be kept simultaneously without being disposed (defaults to 2)
    pagesBufferLength: 2,
  },
  // Allow cross-origin requests from IP addresses in development
  experimental: {
    allowedDevOrigins: ['192.168.20.41', '192.168.20.51'],
  },
  // Remove console logs in production for security
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  // Webpack configuration to handle large strings better
  webpack: (config, { dev, isServer, webpack }) => {
    // Apply optimizations for all client builds
    if (!isServer) {
      // Apply split chunks optimization to reduce bundle sizes
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Split large libraries into separate chunks
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'recharts',
              priority: 10,
            },
            // Split type definitions into separate chunk
            types: {
              test: /[\\/]shared[\\/]types[\\/]/,
              name: 'types',
              priority: 5,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
      
      // Disable performance hints that trigger warnings
      config.performance = false;
    }
    
    // Suppress webpack warnings for all builds
    config.infrastructureLogging = {
      ...config.infrastructureLogging,
      level: 'error',
    };
    
    // Filter specific warnings using regex patterns
    config.ignoreWarnings = [
      // Ignore the big strings serialization warning
      /Serializing big strings.*impacts deserialization performance/,
      // Ignore the pack file cache strategy warnings
      /webpack\.cache\.PackFileCacheStrategy/,
      // Ignore ESM dependency graph warnings
      /Node\.js doesn't offer a \(nice\) way to introspect the ESM dependency graph yet/,
      // General cache warnings
      /cache/i,
    ];
    
    // Modify webpack stats to hide warnings
    config.stats = {
      ...config.stats,
      warnings: false,
      warningsFilter: [
        /Serializing big strings/,
        /PackFileCacheStrategy/,
      ],
    };
    
    return config;
  },
}

export default withSentryConfig(nextConfig, {
// For all available options, see:
// https://www.npmjs.com/package/@sentry/webpack-plugin#options

org: "mylodgeio-q1",
project: "nsw-lodgtix",

// Only print logs for uploading source maps in CI
silent: !process.env.CI,

// For all available options, see:
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

// Upload a larger set of source maps for prettier stack traces (increases build time)
widenClientFileUpload: true,

// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
// This can increase your server load as well as your hosting bill.
// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
// side errors will fail.
// tunnelRoute: "/monitoring",

// Automatically tree-shake Sentry logger statements to reduce bundle size
disableLogger: true,

// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
// See the following for more information:
// https://docs.sentry.io/product/crons/
// https://vercel.com/docs/cron-jobs
automaticVercelMonitors: true,
});