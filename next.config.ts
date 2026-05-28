import type { NextConfig } from "next";

const noStoreHeaders = [
  {
    key: "Cache-Control",
    value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/treffpunkt/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/api/treffpunkt/:path*",
        headers: noStoreHeaders,
      },
    ];
  },
};

export default nextConfig;
