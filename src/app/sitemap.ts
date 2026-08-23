import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/constants";

const BASE_URL = getAppUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/login", "/register", "/terms", "/privacy"];

  return routes.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
