import type { MetadataRoute } from "next";
import { getBookableVehicles } from "@/lib/marketing/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://cato-car-rental.vercel.app";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Real vehicles only — demo/fallback cards have no real detail page to list.
  const vehicles = await getBookableVehicles();
  const vehicleRoutes: MetadataRoute.Sitemap = vehicles
    .filter((v) => !v.isDemo)
    .map((v) => ({
      url: `${base}/fleet/${v.id}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [...staticRoutes, ...vehicleRoutes];
}
