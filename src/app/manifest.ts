import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Olimpo — Gestión de Ventas",
    short_name: "Olimpo",
    description: "App de gestión de ventas para Olimpo",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0D7377",
    orientation: "any",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
