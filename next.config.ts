import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

// Content Security Policy directives
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com;
  connect-src 'self' ws: wss: https://api.paystack.co https://api.resend.com https://res.cloudinary.com https://images.unsplash.com;
  frame-src 'self' https://checkout.paystack.com https://standard.paystack.co;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://checkout.paystack.com;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },

  // Allow all local development network origins (phones, tablets, local IPs)
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
    "*.local",
  ],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  async headers() {
    // Only enforce strict production headers (like HSTS) in production
    if (!isProduction) {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "X-Content-Type-Options",
              value: "nosniff",
            },
            {
              key: "Referrer-Policy",
              value: "strict-origin-when-cross-origin",
            },
          ],
        },
      ];
    }

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/collections/:slug",
        destination: "/products?collection=:slug",
        permanent: true,
      },
      {
        source: "/collections",
        destination: "/products",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
