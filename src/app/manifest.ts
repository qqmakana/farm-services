import type { MetadataRoute } from "next";
import { BRAND, BRAND_TAGLINE } from "@/lib/brand";
import { PLAY_LISTING_PUBLIC, PLAY_STORE_PACKAGE, PLAY_STORE_URL } from "@/lib/play-store";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${BRAND.appName} by ${BRAND.company}`,
    short_name: BRAND.appName,
    description: BRAND_TAGLINE,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#000000",
    prefer_related_applications: PLAY_LISTING_PUBLIC,
    related_applications: PLAY_LISTING_PUBLIC
      ? [
          {
            platform: "play",
            id: PLAY_STORE_PACKAGE,
            url: PLAY_STORE_URL,
          },
        ]
      : [],
    categories: ["travel", "business", "shopping"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
