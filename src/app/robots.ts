import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/constants";

const BASE_URL = getAppUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/documents", "/chat", "/collections", "/search", "/analytics", "/settings", "/conversations", "/api"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
