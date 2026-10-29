import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Đóng gói tối giản cho Docker
  output: "standalone",
};

export default nextConfig;
