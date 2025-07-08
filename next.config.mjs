/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
    serverActions: true
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
    return config;
  }
};

export default nextConfig;
