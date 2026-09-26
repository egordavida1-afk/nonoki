import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nonoki",
    short_name: "Nonoki",
    description: "Фильмы, сериалы, аниме и мультфильмы в одном месте.",
    start_url: "/",
    display: "standalone",
    background_color: "#080a10",
    theme_color: "#080a10",
    lang: "ru",
    icons: [{ src: "/nonoki-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
