// app/manifest.ts
// PWA Manifest Configuration for GALLA.GOLD
// This file generates the manifest.json dynamically

import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GALLA.GOLD - Gold Investment Platform",
    short_name: "GALLA.GOLD",
    description:
      "Invest in physical gold with ease. Buy, sell, and store gold securely.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#FFB800",
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: "/android-icon-36x36.png",
        sizes: "36x36",
        type: "image/png",
      },
      {
        src: "/android-icon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/android-icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/android-icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/android-icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "/android-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    categories: ["finance", "business"],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "View your portfolio",
        url: "/dashboard",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
          },
        ],
      },
      {
        name: "Buy Gold",
        short_name: "Buy",
        description: "Purchase gold",
        url: "/dashboard/buy",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
          },
        ],
      },
    ],
  };
}
