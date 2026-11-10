import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/navigation/redirect";
import { publicEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"));
  const login = (error: string) => {
    const url = new URL("/login", publicEnv.appOrigin);
    url.searchParams.set("next", next);
    url.searchParams.set("error", error);
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };
  if (request.nextUrl.searchParams.has("error")) {
    return login(request.nextUrl.searchParams.get("error_code") === "otp_expired" ? "otp_expired" : "callback_failed");
  }
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return login("callback_failed");

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) return login("callback_failed");

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("id").eq("id", data.user.id).maybeSingle();
    if (profileError) return login("profile_failed");

    const destination = profile ? next : `/perfil/nuevo?next=${encodeURIComponent(next)}`;
    const response = NextResponse.redirect(new URL(destination, publicEnv.appOrigin));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return login("callback_failed");
  }
}
