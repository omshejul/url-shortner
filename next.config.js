/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/link',
  assetPrefix: '/link',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}

module.exports = nextConfig