import type { Metadata } from "next";
import Link from "next/link";
import { WelcomeExperience } from "@/components/welcome-experience";

export const metadata: Metadata = { title: "Cómo funciona Spotea", robots: { index: false, follow: true } };
export default function WelcomePage() {
  return <><WelcomeExperience /><Link href="/" className="relative mt-8 flex min-h-11 items-center justify-center text-xs text-violet-soft underline">Explorar sin cuenta</Link></>;
}
