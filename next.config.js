// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**', // les URLs Pexels sont sur images.pexels.com/photos/.../...
      },
      {
        protocol: 'https',
        hostname: 'mfxjzvqtkespoichhnkk.supabase.co', // ton domaine Supabase
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer'),
    }
    return config
  },
}

module.exports = nextConfig
