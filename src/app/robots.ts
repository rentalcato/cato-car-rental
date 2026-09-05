import type { MetadataRoute } from "next";

/** Keeps crawlers off the authenticated app — nothing behind /login is meant to be indexed anyway. */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://cato-car-rental.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/fleet", "/terms", "/privacy"],
      disallow: ["/dashboard", "/account", "/login", "/signup", "/unauthorized", "/auth"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
