import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w780";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

export type TmdbSyncResult = {
  imported: number;
  updated: number;
  movies: number;
  series: number;
  cartoons: number;
  skipped: number;
};

type TmdbListItem = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  origin_country?: string[];
};

type TmdbResponse = { page?: number; total_pages?: number; results?: TmdbListItem[] };

type TmdbCategory = "movie" | "series" | "cartoon" | "anime";

function token() {
  return process.env.TMDB_API_READ_ACCESS_TOKEN?.trim() || process.env.TMDB_API_TOKEN?.trim() || "";
}

async function tmdbGet<T>(path: string, params: Record<string, string | number | boolean | undefined> = {}) {
  const accessToken = token();
  if (!accessToken) throw new Error("TMDB API не настроен: добавь TMDB_API_READ_ACCESS_TOKEN.");
  const url = new URL(`${TMDB_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
  const response = await fetch(url, {
    headers: { accept: "application/json", Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`TMDB вернул ${response.status}.`);
  return response.json() as Promise<T>;
}

function yearOf(value?: string) {
  const year = Number(value?.slice(0, 4));
  return Number.isInteger(year) && year > 1800 ? year : null;
}

function clean(value: unknown, max = 5000) {
  return String(value || "").replace(/<[^>]*>/g, "").trim().slice(0, max) || null;
}

async function uniqueSlug(title: string, sourceKey: string) {
  const base = slugify(title).slice(0, 48) || "title";
  const hash = Array.from(sourceKey).reduce((acc, char) => ((acc * 33 + char.charCodeAt(0)) >>> 0), 5381).toString(36).slice(0, 7);
  let slug = `${base}-${hash}`.slice(0, 60);
  let i = 2;
  while (await prisma.anime.findUnique({ where: { slug } })) slug = `${base}-${hash}-${i++}`.slice(0, 60);
  return slug;
}

async function upsertItem(item: TmdbListItem, kind: "movie" | "tv", category: TmdbCategory) {
  const title = clean(kind === "movie" ? item.title : item.name, 160);
  if (!title) return "skipped" as const;
  const sourceKey = `tmdb:${kind}:${item.id}`;
  const originalTitle = clean(kind === "movie" ? item.original_title : item.original_name, 160);
  const posterUrl = item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : null;
  const backgroundUrl = item.backdrop_path ? `${BACKDROP_BASE}${item.backdrop_path}` : posterUrl;
  const year = yearOf(kind === "movie" ? item.release_date : item.first_air_date);
  const existing = await prisma.anime.findUnique({ where: { sourceKey } });
  const data = {
    title,
    originalTitle,
    description: clean(item.overview, 5000),
    posterUrl,
    backgroundUrl,
    year,
    category,
    type: kind === "movie" ? "movie" : "series",
    source: "tmdb",
    sourceKey,
  };
  if (existing) {
    await prisma.anime.update({ where: { id: existing.id }, data: {
      ...data,
      posterUrl: existing.posterUrl || posterUrl,
      backgroundUrl: existing.backgroundUrl || backgroundUrl,
      description: existing.description || clean(item.overview, 5000),
      originalTitle: existing.originalTitle || originalTitle,
      year: existing.year || year,
    } });
    return "updated" as const;
  }
  await prisma.anime.create({ data: { slug: await uniqueSlug(title, sourceKey), ...data } });
  return "imported" as const;
}

async function discoverPages(path: "/discover/movie" | "/discover/tv", params: Record<string, string | number>, maxPages: number) {
  const results: TmdbListItem[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const response = await tmdbGet<TmdbResponse>(path, { language: "ru-RU", include_adult: false, sort_by: "popularity.desc", page, ...params });
    results.push(...(response.results || []));
    if (!response.total_pages || page >= response.total_pages) break;
  }
  return results;
}

export async function syncTmdbCatalog(): Promise<TmdbSyncResult> {
  const pages = Math.max(1, Math.min(20, Number(process.env.TMDB_MAX_PAGES || 3)));
  const [movies, series, cartoonsMovie, cartoonsTv] = await Promise.all([
    discoverPages("/discover/movie", {}, pages),
    discoverPages("/discover/tv", {}, pages),
    discoverPages("/discover/movie", { with_genres: 16 }, Math.min(pages, 2)),
    discoverPages("/discover/tv", { with_genres: 16 }, Math.min(pages, 2)),
  ]);
  const cartoonIds = new Set([
    ...cartoonsMovie.map((item) => `movie:${item.id}`),
    ...cartoonsTv.map((item) => `tv:${item.id}`),
  ]);
  const isAnime = (item: TmdbListItem) => Boolean(item.genre_ids?.includes(16) && item.origin_country?.includes("JP"));
  const all: Array<{ item: TmdbListItem; kind: "movie" | "tv"; category: TmdbCategory }> = [
    ...movies.map((item) => ({ item, kind: "movie" as const, category: isAnime(item) ? "anime" as const : cartoonIds.has(`movie:${item.id}`) ? "cartoon" as const : "movie" as const })),
    ...series.map((item) => ({ item, kind: "tv" as const, category: isAnime(item) ? "anime" as const : cartoonIds.has(`tv:${item.id}`) ? "cartoon" as const : "series" as const })),
  ];
  const unique = new Map<string, (typeof all)[number]>();
  for (const row of all) unique.set(`${row.kind}:${row.item.id}`, row);
  let imported = 0, updated = 0, skipped = 0;
  for (const row of unique.values()) {
    const result = await upsertItem(row.item, row.kind, row.category);
    if (result === "imported") imported++;
    else if (result === "updated") updated++;
    else skipped++;
  }
  return {
    imported,
    updated,
    movies: movies.length,
    series: series.length,
    cartoons: [...cartoonsMovie, ...cartoonsTv].length,
    skipped,
  };
}
