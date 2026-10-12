import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Photo Reminder | Laís & Luan",
    short_name: "L & L",
    description: "Álbum de fotos do casamento da Laís e do Luan.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7ef",
    theme_color: "#6f7f3f",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
