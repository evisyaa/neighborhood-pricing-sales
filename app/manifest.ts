import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Neighborhood Pricing Sales",
    short_name: "NP Sales",
    description: "Neighborhood Pricing field sales app",
    start_url: "/map",
    display: "standalone",
    background_color: "#f4f7fb",
    theme_color: "#0b3b66",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
