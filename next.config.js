/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
  output: 'export',
  images: {
    unoptimized: true, // required for static export
  },
}

module.exports = nextConfig
