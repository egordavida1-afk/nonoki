import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "METRA",
    short_name: "METRA",
    description: "Р¤РёР»СЊРјС‹, СЃРµСЂРёР°Р»С‹, Р°РЅРёРјРµ Рё РјСѓР»СЊС‚С„РёР»СЊРјС‹ РІ РѕРґРЅРѕРј РјРµСЃС‚Рµ.",
    start_url: "/",
    display: "standalone",
    background_color: "#080a10",
    theme_color: "#080a10",
    lang: "ru",
    icons: [{ src: "/metra-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

