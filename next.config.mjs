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
  reactStrictMode: true,
  devIndicators: {
    position: 'bottom-right',
  },
  // Disable client console messages for Fast Refresh
  onDemandEntries: {
    // Keep the build page in memory for this many ms (defaults to 60000)
    maxInactiveAge: 60 * 1000,
    // Number of pages that should be kept simultaneously without being disposed (defaults to 2)
    pagesBufferLength: 2,
  }
}

export default nextConfig