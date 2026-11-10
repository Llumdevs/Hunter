import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Sesión opcional: para páginas que se ven con o sin cuenta (sin redirigir).
export async function optionalUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub ?? null;
  if (!userId) return { supabase, userId: null, displayName: null };
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
  return { supabase, userId: profile ? userId : null, displayName: profile?.display_name ?? null };
}
