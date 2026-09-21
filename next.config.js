// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },

  // En-têtes de sécurité. Le portail et l'admin ne doivent jamais s'afficher
  // dans le cadre d'un autre site (détournement de clic sur « Record the
  // return », « Remove »…). Les pages publiques gardent le réglage par défaut.
  async headers() {
    const base = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];
    const noFrame = [
      ...base,
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      // Rien de ce que ces écrans affichent ne doit rester dans un cache partagé.
      { key: "Cache-Control", value: "no-store" },
    ];
    return [
      { source: "/:path*", headers: base },
      ...["login", "dashboard", "items/:path*", "review", "team", "import", "onboarding"].flatMap((p) => [
        { source: `/campus/${p}`, headers: noFrame },
        { source: `/org/${p}`, headers: noFrame },
      ]),
      { source: "/admin/:path*", headers: noFrame },
      { source: "/api/org/:path*", headers: [...base, { key: "Cache-Control", value: "no-store" }] },
    ];
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

      // ✅ Ancienne landing page de la formule payante
      {
        source: "/maximum-search",
        destination: "/active-search",
        permanent: true,
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
