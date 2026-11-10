import { LoginForm } from "./login-form";
import { safeRedirectPath } from "@/lib/navigation/redirect";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LoginForm next={safeRedirectPath(next ?? null)} />;
}
