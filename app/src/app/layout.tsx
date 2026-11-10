import "@fontsource-variable/plus-jakarta-sans";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hunter",
  description: "Sabe dónde vas antes de ir.",
  applicationName: "Hunter",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#170d24",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-6">{children}</main>
      </body>
    </html>
  );
}
