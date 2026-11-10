import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

// Usuario verificado (getClaims valida el JWT) con perfil creado. Si falta algo, redirige
// al paso correspondiente y vuelve después a `returnTo`.
export async function requireUserWithProfile(returnTo: string): Promise<{ supabase: ServerClient; userId: string }> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  const next = encodeURIComponent(returnTo);
  if (!userId) redirect(`/login?next=${next}`);

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (!profile) redirect(`/perfil/nuevo?next=${next}`);
  return { supabase, userId };
}
