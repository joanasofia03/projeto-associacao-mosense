import type { NextConfig } from "next";

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const projectHostname = new URL(projectUrl).hostname;

const nextConfig: NextConfig = {
  images: {
    domains: [projectHostname],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: projectHostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
