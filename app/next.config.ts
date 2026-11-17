import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
];

const nextConfig: NextConfig = {
  images: { unoptimized: process.env.HUNTER_CLOUDFLARE === "1" },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/:section(login|auth|perfil|planes|compras|invitaciones|amigos|ranking|valoraciones|panel|demo|bienvenida|escanear|c|canje)/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
