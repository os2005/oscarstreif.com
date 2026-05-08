import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/CV",
        destination: "/cv",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
