import type { MetadataRoute } from "next";
import { absoluteUrl, indexingEnabled } from "@/lib/public/seo";
import { createSupabasePublicClient } from "@/lib/supabase/public";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!indexingEnabled) return [];
  const { data, error } = await createSupabasePublicClient().from("places")
    .select("id").eq("is_active", true).eq("is_demo", false).is("demo_owner_id", null).limit(10000);
  if (error) throw new Error("No se ha podido generar el catálogo público del sitemap.");
  return [{ url: absoluteUrl("/") }, { url: absoluteUrl("/mapa") },
    ...(data ?? []).map(place => ({ url: absoluteUrl(`/local/${place.id}`) }))];
}
