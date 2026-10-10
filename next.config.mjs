/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['bullmq'],
  },
  webpack: (config, { webpack }) => {
    // BullMQ optionally requires @valkey/valkey-glide which is not installed.
    // Use IgnorePlugin to tell Webpack to completely ignore this import.
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@valkey\/valkey-glide$/,
      })
    );
    return config;
  },
};

export default nextConfig;
