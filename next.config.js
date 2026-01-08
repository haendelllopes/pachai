/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA support
  swcMinify: true,
  // Exclude Supabase Edge Functions from build
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /supabase\/functions\/.*\.ts$/,
      use: 'ignore-loader',
    })
    return config
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

