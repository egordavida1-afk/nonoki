import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://nonoki.ru").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await prisma.anime.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return [
    { url: SITE_URL, lastModified: new Date() },
    { url: `${SITE_URL}/catalog`, lastModified: new Date() },
    ...items.map((item) => ({
      url: `${SITE_URL}/anime/${item.slug}`,
      lastModified: item.updatedAt,
    })),
  ];
}
