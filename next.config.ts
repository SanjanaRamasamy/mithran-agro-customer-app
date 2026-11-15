import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "sfile.chatglm.cn" },
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/webp"],
  },
};

export default nextConfig;
