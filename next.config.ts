import type { NextConfig } from "next";

// The public marketing pages (/, /fleet/[id]) render vehicle photos through
// next/image — real Supabase Storage URLs when a vehicle has an uploaded
// photo, stock Unsplash URLs otherwise (hero + fallback cards). Both hosts
// must be allow-listed or next/image throws for the one Storage is on.
// Everywhere else in the app deliberately uses plain <img> against Storage
// URLs, which needs no remote-pattern config.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname }]
        : []),
    ],
  },
};

export default nextConfig;
