import type { MetadataRoute } from "next";
import { absoluteUrl, indexingEnabled, privatePaths } from "@/lib/public/seo";
import { DEMO_PLACES } from "@/lib/demo/catalog";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", ...(indexingEnabled
    ? { allow: "/", disallow: [...privatePaths, ...DEMO_PLACES.map(p => `/local/${p.id}`)] }
    : { disallow: "/" }) }, ...(indexingEnabled ? { sitemap: absoluteUrl("/sitemap.xml") } : {}) };
}
