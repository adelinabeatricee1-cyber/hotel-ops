import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hotel Ops",
    short_name: "Hotel Ops",
    description: "Management operațional pentru hoteluri",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#676435",
    icons: [
      {
        src: "/pwa-icon-192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/pwa-icon-512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa-icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
