// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
      { protocol: "https", hostname: "mfxjzvqtkespoichhnkk.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },

      // (ajoute ici toute source réelle d’images que tu utilises)
      // { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      // { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/**" },
    ],
  },

  async redirects() {
    return [
      {
        source: "/category/:slug",
        destination: "/lost-and-found/category/:slug",
        permanent: true, // 301
      },
    ];
  },

  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve("buffer"),
    };
    return config;
  },
};

module.exports = nextConfig;
