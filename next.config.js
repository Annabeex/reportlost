// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Autorise les images distantes utilisées par <Image />
    remotePatterns: [
      // Pexels (si tu utilises leurs images)
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      // Supabase Storage (public bucket)
      {
        protocol: 'https',
        hostname: 'mfxjzvqtkespoichhnkk.supabase.co', // ton projet
        pathname: '/storage/v1/object/public/**',
      },
      // (optionnel) autoriser d’autres projets Supabase si besoin
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async rewrites() {
    return [
      // Anciennes URLs -> nouvelles catégories
      { source: '/category/:slug', destination: '/lost-and-found/category/:slug' },
    ];
  },

  // Ton fallback webpack existant
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer'),
    };
    return config;
  },
};

module.exports = nextConfig;
