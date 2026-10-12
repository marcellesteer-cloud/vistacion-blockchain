import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/src/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const allowIndexing =
    process.env.VERCEL_ENV === "production" ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production");

  return {
    rules: {
      userAgent: "*",
      allow: allowIndexing ? "/" : [],
      disallow: allowIndexing ? undefined : "/",
    },
    sitemap: new URL("/sitemap.xml", getSiteUrl()).toString(),
  };
}
