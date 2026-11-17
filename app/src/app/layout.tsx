import "@fontsource-variable/plus-jakarta-sans";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { publicEnv } from "@/lib/env";
import { indexingEnabled } from "@/lib/public/seo";
import "leaflet/dist/leaflet.css";
import { DemoProvider } from "@/components/demo/provider";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.appOrigin),
  robots: { index: indexingEnabled, follow: indexingEnabled },
  title: "Hunter",
  description: "Sabe dónde vas antes de ir.",
  applicationName: "Hunter",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101524",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <DemoProvider><main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-6">{children}</main></DemoProvider>
      </body>
    </html>
  );
}
