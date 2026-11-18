import type { MetadataRoute } from "next";

const BASE = (process.env.NEXTAUTH_URL || "http://localhost:3001").trim().replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/settings", "/api/"] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
