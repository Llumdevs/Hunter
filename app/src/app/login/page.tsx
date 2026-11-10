import { LoginForm } from "./login-form";
import { safeRedirectPath } from "@/lib/navigation/redirect";
import { loginErrorMessage } from "@/lib/auth/login-errors";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return <LoginForm next={safeRedirectPath(next ?? null)} initialError={error ? loginErrorMessage(error) : null} />;
}
