import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Temporarily ignore ESLint errors during build due to eslint-config-next module issue
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: [
    'sparing-semigovernmentally-brandi.ngrok-free.dev',
    '*.ngrok-free.dev',
    '*.ngrok.io',
  ],
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking attacks
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Control referrer information leakage
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable unnecessary browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Content Security Policy - controls which resources can load
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + Stripe + inline for Next.js hydration
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              // Styles: self + inline for styled-components/emotion
              "style-src 'self' 'unsafe-inline'",
              // Images: self + data URIs + any HTTPS (avatars, etc.)
              "img-src 'self' data: https:",
              // API connections
              "connect-src 'self' https://*.supabase.co https://api.stripe.com https://app.posthog.com",
              // Stripe payment frames
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              // Fonts from self
              "font-src 'self'",
            ].join('; '),
          },
          // Force HTTPS for 1 year (only effective in production with HTTPS)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
  // Redirect clockalign.app to clockalign.com for consistent auth cookies
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'clockalign.app',
          },
        ],
        destination: 'https://clockalign.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.clockalign.app',
          },
        ],
        destination: 'https://clockalign.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.clockalign.com',
          },
        ],
        destination: 'https://clockalign.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
