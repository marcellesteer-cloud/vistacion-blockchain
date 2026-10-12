import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/src/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const routes = ["/", "/staking", "/escrow", "/governance", "/ico"];

  return routes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
