import { DemoControls } from "@/components/demo/demo-panels";
import { AppShell } from "@/components/app-shell";
import { requireUserWithProfile } from "@/lib/auth/session";

export default async function DemoPage() {
  await requireUserWithProfile("/demo");
  return <AppShell><DemoControls /></AppShell>;
}
