import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'techcrunch.com',
      port: '',
      pathname: '/**'
    }]
  },
};

export default nextConfig;
