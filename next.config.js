// next.config.js
/** @type {import('next').NextConfig} */

// --- Security headers (CSP + basics)
const securityHeaders = [
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next + GA + Stripe script tags (+ inline init for gtag)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com",
      // API/XHR/WebSocket destinations (Supabase, GA, Stripe)
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://api.stripe.com https://rs.stripe.com https://q.stripe.com https://m.stripe.network",
      // iframes Stripe
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      // images (Next/Image optimisées + data/blob)
      "img-src 'self' https: data: blob:",
      // styles (Next + fonts)
      "style-src 'self' 'unsafe-inline'",
      // fonts (Google fonts via next/font + data)
      "font-src 'self' https://fonts.gstatic.com data:",
      // workers (au cas où)
      "worker-src 'self' blob:",
      // formulaires / base
      "form-action 'self'",
      "base-uri 'self'",
      // qui peut embarquer le site
      "frame-ancestors 'self'",
    ].join("; "),
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
      // ajoute d'autres sources si besoin :
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

  // Applique les en-têtes de sécurité à tout le site
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  // Fallback léger (utile pour certains packages)
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve("buffer"),
    };
    return config;
  },
};

module.exports = nextConfig;
