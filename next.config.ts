import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow a crisper quality for the full-bleed hero (Next 16 requires each
    // quality used be listed here).
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
