import type { MetadataRoute } from "next";

const FALLBACK_ORIGIN = "https://marketingtribe-momo-1021.netlify.app";

function getSiteOrigin() {
  const appUrl = process.env.APP_URL;

  if (!appUrl) return FALLBACK_ORIGIN;

  try {
    return new URL(appUrl).origin;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const routes = [
    { path: "/", priority: 1 },
    { path: "/signup", priority: 0.9 },
    { path: "/login", priority: 0.8 },
    { path: "/forgot-password", priority: 0.7 },
    { path: "/reset-password", priority: 0.6 },
    { path: "/welcome", priority: 0.6 },
  ];

  return routes.map(({ path, priority }) => ({
    url: new URL(path, origin).toString(),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority,
  }));
}
