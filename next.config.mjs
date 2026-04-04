/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin', '@polygon.io/client-js']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          fs: false,
          net: false,
          tls: false,
          dns: false,
          child_process: false,
          http2: false,
          stream: false,
          crypto: false,
          path: false,
          os: false
        }
      };
    }

    // Add support for the Polygon.io client
    config.resolve.alias = {
      ...config.resolve.alias,
      '@polygon.io/client-js': '@polygon.io/client-js'
    };

    return config;
  }
};

export default nextConfig;
