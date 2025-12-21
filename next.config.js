// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },

  async redirects() {
    return [
      // ✅ Force www -> non-www (canonical)
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.reportlost.org",
          },
        ],
        destination: "https://reportlost.org/:path*",
        permanent: true, // 308
      },

      // ✅ Tes redirects existants
      {
        source: "/category/:slug",
        destination: "/lost-and-found/category/:slug",
        permanent: true,
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
