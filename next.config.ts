import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only the public marketing homepage uses next/image with a remote
    // host (hero + fleet-showcase stock photography) — everything else
    // in the app uses plain <img> against Supabase Storage's own public
    // URLs, which need no remote-pattern config.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
