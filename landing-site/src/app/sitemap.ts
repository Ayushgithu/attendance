import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_LANDING_URL || "http://localhost:3000").trim().replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${BASE}/`, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
