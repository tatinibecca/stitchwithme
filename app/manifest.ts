import type { MetadataRoute } from "next";

/** Manifesto da PWA. Ícones em public/icons/ (pacote de marca Casita). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Casita",
    short_name: "Casita",
    description: "Sua vida em casa, mais leve.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8EE",
    theme_color: "#4F6755",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
