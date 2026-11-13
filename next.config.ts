import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/klassisk", destination: "/klassisk.html", permanent: false }];
  },
};

export default nextConfig;
