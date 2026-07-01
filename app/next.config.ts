import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  allowedDevOrigins: ['192.168.0.7', 'easy-hands-go.loca.lt', 'localhost:3000'],
}

export default nextConfig
