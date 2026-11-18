import type { MetadataRoute } from "next";

// Only public pages are listed: the dashboard needs a login, so search engines should not crawl it.
const BASE = (process.env.NEXTAUTH_URL || "http://localhost:3001").trim().replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "yearly", priority: 1 },
    { url: `${BASE}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
  ];
}
