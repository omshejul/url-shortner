/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/link',
  assetPrefix: '/link',
  // Ensure proper routing for the subdirectory
  trailingSlash: false,
  // Configure images for Google profile pictures
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Ensure proper handling of API routes
  async rewrites() {
    return [
      {
        source: '/link/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
  // Configure headers for proper CORS and security
  async headers() {
    return [
      {
        source: '/link/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig