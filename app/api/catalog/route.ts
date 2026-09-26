import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchWhere, categoryLabel, typeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const category = ["movie", "series", "anime", "cartoon"].includes(searchParams.get("category") || "") ? searchParams.get("category")! : "";
  const genre = searchParams.get("genre")?.trim() || "";
  const offset = Math.max(0, Number(searchParams.get("offset") || 0));
  const limit = Math.min(24, Math.max(1, Number(searchParams.get("limit") || 24)));
  const where = {
    ...(category ? { category } : {}),
    ...(genre ? { genres: { contains: genre, mode: "insensitive" as const } } : {}),
    ...searchWhere(q),
  };
  const items = await prisma.anime.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: offset,
    take: limit + 1,
    select: { id: true, slug: true, title: true, originalTitle: true, posterUrl: true, year: true, category: true, type: true },
  });
  const hasMore = items.length > limit;
  return NextResponse.json({
    items: items.slice(0, limit),
    hasMore,
    nextOffset: hasMore ? offset + limit : null,
    labels: { category: categoryLabel(category), type: typeLabel("series") },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
