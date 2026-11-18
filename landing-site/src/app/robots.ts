import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_LANDING_URL || "http://localhost:3000").trim().replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
