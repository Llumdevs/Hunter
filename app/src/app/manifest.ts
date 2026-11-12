import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hunter",
    short_name: "Hunter",
    description: "Descubre cómo es un sitio antes de ir.",
    start_url: "/",
    display: "standalone",
    background_color: "#101524",
    theme_color: "#101524",
    lang: "es",
    icons: [
      { src: "/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
