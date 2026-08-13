import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Sub-URL configuration: /lhn
  // When accessed directly or via reverse proxy at http://172.18.18.64/lhn
  basePath: '/lhn',
};

export default nextConfig;
