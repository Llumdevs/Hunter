import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hunter",
    short_name: "Hunter",
    description: "Descubre cómo es un sitio antes de ir.",
    start_url: "/",
    display: "standalone",
    background_color: "#080a09",
    theme_color: "#080a09",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
