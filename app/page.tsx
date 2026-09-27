import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user-auth";
import { categoryLabel, typeLabel } from "@/lib/utils";
import HeroCarousel, { type HeroItem } from "./components_HeroCarousel";

export const dynamic = "force-dynamic";

const fallbackPoster = "https://placehold.co/600x900/10121c/9ea4b8?text=Nonoki";

type CatalogItem = {
  id: string;
  slug: string;
  title: string;
  posterUrl: string | null;
  backgroundUrl: string | null;
  year: number | null;
  category: string;
  type: string;
  description: string | null;
  status: string;
  createdAt: Date;
  seasons: Array<{ episodes: Array<unknown> }>;
  _count: { favorites: number };
  kodikSources?: Array<{ seasonsJson: unknown }>;
  progress?: {
    seasonNumber: number;
    episodeNumber: number;
    positionSeconds: number;
    durationSeconds: number | null;
    overallPercent: number;
  };
};

export default async function HomePage() {
  const user = await getCurrentUser();
  const include = {
    seasons: { include: { episodes: true } },
    _count: { select: { favorites: true } },
    kodikSources: { select: { seasonsJson: true } },
  } as const;

  const pulseSince = new Date(Date.now() - 15 * 60 * 1000);
  const [latest, popular, movies, series, anime, cartoons, favoriteRows, progressRows, pulseRows] = await Promise.all([
    prisma.anime.findMany({ include, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.anime.findMany({ include, orderBy: [{ favorites: { _count: "desc" } }, { createdAt: "desc" }], take: 12 }),
    prisma.anime.findMany({ include, where: { category: "movie" }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.anime.findMany({ include, where: { category: "series" }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.anime.findMany({ include, where: { category: "anime" }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.anime.findMany({ include, where: { category: "cartoon" }, orderBy: { createdAt: "desc" }, take: 12 }),
    user
      ? prisma.favorite.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: { anime: { include } },
        })
      : Promise.resolve([]),
    user
      ? prisma.watchProgress.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          take: 5000,
          include: { anime: { include } },
        })
      : Promise.resolve([]),
    prisma.watchProgress.findMany({
      where: { updatedAt: { gte: pulseSince }, completed: false },
      select: { userId: true, anime: { select: { category: true } } },
      take: 2500,
    }),
  ]);

  const pulseUsers = new Set<string>();
  const pulseCategories = new Map<string, Set<string>>();
  for (const row of pulseRows as any[]) {
    pulseUsers.add(row.userId);
    const category = row.anime?.category || "movie";
    const set = pulseCategories.get(category) ?? new Set<string>();
    set.add(row.userId);
    pulseCategories.set(category, set);
  }

  const favorites = favoriteRows.map((row: any) => row.anime).filter(Boolean) as CatalogItem[];
  const progressByAnime = new Map<string, any[]>();
  for (const row of progressRows as any[]) {
    if (!row.anime) continue;
    const list = progressByAnime.get(row.anime.id) ?? [];
    list.push(row);
    progressByAnime.set(row.anime.id, list);
  }

  const continueMap = new Map<string, CatalogItem>();
  for (const row of progressRows as any[]) {
    if (!row.anime || row.completed || continueMap.has(row.anime.id)) continue;
    const itemRows = progressByAnime.get(row.anime.id) ?? [];
    continueMap.set(row.anime.id, {
      ...row.anime,
      progress: {
        seasonNumber: row.seasonNumber,
        episodeNumber: row.episodeNumber,
        positionSeconds: row.positionSeconds,
        durationSeconds: row.durationSeconds,
        overallPercent: calculateOverallPercent(row.anime, itemRows),
      },
    });
  }
  const continueWatching = [...continueMap.values()].slice(0, 8);
  const allCandidates = [...popular, ...latest, ...movies, ...series, ...anime, ...cartoons] as CatalogItem[];
  const preferredCategory = getPreferredCategory(progressRows as any[], favoriteRows as any[]);
  const excluded = new Set([...continueWatching.map((item) => item.id), ...favorites.map((item) => item.id)]);
  const flowRecommendations = dedupeItems(allCandidates)
    .filter((item) => !excluded.has(item.id))
    .sort((a, b) => {
      const aScore = (a.category === preferredCategory ? 1000 : 0) + (a._count?.favorites ?? 0) * 10 + new Date(a.createdAt ?? 0).getTime() / 1e12;
      const bScore = (b.category === preferredCategory ? 1000 : 0) + (b._count?.favorites ?? 0) * 10 + new Date(b.createdAt ?? 0).getTime() / 1e12;
      return bScore - aScore;
    })
    .slice(0, 6);

  const heroItems: HeroItem[] = latest.slice(0, 6).map((item: any) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    posterUrl: item.posterUrl,
    backgroundUrl: item.backgroundUrl,
    year: item.year,
    category: item.category,
    type: item.type,
    description: item.description,
    episodes: item.seasons.reduce((n: number, season: any) => n + season.episodes.length, 0),
  }));

  return (
    <div className="home-page">
      {heroItems.length ? (
        <HeroCarousel items={heroItems} />
      ) : (
        <section className="home-empty">
          <div className="hero-eyebrow"><span className="hero-dot" /> Nonoki</div>
          <h1>РўРІРѕСЏ РјРµРґРёР°С‚РµРєР°<br />РІ РѕРґРЅРѕРј РјРµСЃС‚Рµ.</h1>
          <p>Р”РѕР±Р°РІСЊ С‚Р°Р№С‚Р»С‹ С‡РµСЂРµР· Р°РґРјРёРЅРєСѓ вЂ” РѕРЅРё РїРѕСЏРІСЏС‚СЃСЏ Р·РґРµСЃСЊ РєСЂР°СЃРёРІС‹РјРё РїРѕРґР±РѕСЂРєР°РјРё.</p>
          <Link href="/catalog" className="hero-button">РћС‚РєСЂС‹С‚СЊ РєР°С‚Р°Р»РѕРі</Link>
        </section>
      )}

      <div className="home-sections">
        <ToriiPulse
          viewers={pulseUsers.size}
          categories={{
            movie: pulseCategories.get("movie")?.size ?? 0,
            series: pulseCategories.get("series")?.size ?? 0,
            anime: pulseCategories.get("anime")?.size ?? 0,
            cartoon: pulseCategories.get("cartoon")?.size ?? 0,
          }}
        />

        {user ? (
          <section className="flow-section">
            <div className="flow-head">
              <div>
                <div className="flow-kicker"><span className="flow-orb" /> Nonoki FLOW</div>
                <h2>РџСЂРѕРґРѕР»Р¶Р°Р№С‚Рµ СЃРІРѕСЋ РёСЃС‚РѕСЂРёСЋ</h2>
                <p>Nonoki СЃРѕР±РёСЂР°РµС‚ СЃР»РµРґСѓСЋС‰СѓСЋ С‡Р°СЃС‚СЊ РїСЂРѕСЃРјРѕС‚СЂР° РёР· РІР°С€РµР№ РёСЃС‚РѕСЂРёРё Рё Р»СЋР±РёРјС‹С… СЂР°Р·РґРµР»РѕРІ.</p>
              </div>
              <Link href="/favorites" className="flow-link">РњРѕР№ СЃРїРёСЃРѕРє в†’</Link>
            </div>
            <div className="flow-layout">
              {continueWatching[0] ? (
                <Link href={`/anime/${continueWatching[0].slug}?${continueWatching[0].progress?.seasonNumber ? `season=${continueWatching[0].progress.seasonNumber}&` : ""}ep=${continueWatching[0].progress?.episodeNumber ?? 0}`} className="flow-resume">
                  <div className="flow-resume-image">
                    <img src={continueWatching[0].posterUrl || fallbackPoster} alt={continueWatching[0].title} />
                    <div className="flow-resume-glow" />
                    <span className="flow-resume-play">в–¶</span>
                  </div>
                  <div className="flow-resume-copy">
                    <span className="flow-label">РџСЂРѕРґРѕР»Р¶РёС‚СЊ</span>
                    <h3>{continueWatching[0].title}</h3>
                    <p>{continueWatching[0].progress?.seasonNumber ? `РЎРµР·РѕРЅ ${continueWatching[0].progress.seasonNumber} В· ` : ""}РЎРµСЂРёСЏ {continueWatching[0].progress?.episodeNumber ?? 0}</p>
                    <div className="flow-progress-bar"><span style={{ width: `${continueWatching[0].progress?.overallPercent ?? 0}%` }} /></div>
                    <div className="flow-progress-meta"><span>{continueWatching[0].progress?.overallPercent ?? 0}% РїСЂРѕСЃРјРѕС‚СЂРµРЅРѕ</span><span>РћС‚РєСЂС‹С‚СЊ в†’</span></div>
                  </div>
                </Link>
              ) : (
                <div className="flow-resume flow-resume-empty">
                  <div className="flow-empty-symbol">вњ¦</div>
                  <div><span className="flow-label">Р’Р°С€ РїРѕС‚РѕРє РїСѓСЃС‚</span><h3>РќР°С‡РЅРёС‚Рµ СЃРјРѕС‚СЂРµС‚СЊ</h3><p>РџРѕСЃР»Рµ РїРµСЂРІРѕРіРѕ РїСЂРѕСЃРјРѕС‚СЂР° Nonoki Р·Р°РїРѕРјРЅРёС‚, РіРґРµ РІС‹ РѕСЃС‚Р°РЅРѕРІРёР»РёСЃСЊ.</p></div>
                </div>
              )}
              <div className="flow-picks">
                {flowRecommendations.slice(0, 4).map((item) => (
                  <Link key={item.id} href={`/anime/${item.slug}`} className="flow-pick">
                    <img src={item.posterUrl || fallbackPoster} alt={item.title} loading="lazy" />
                    <div><span>{categoryLabel(item.category)}</span><strong>{item.title}</strong></div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <CatalogRail title="РќРѕРІРёРЅРєРё" href="/catalog" items={latest as CatalogItem[]} />
        <CatalogRail title="РџРѕРїСѓР»СЏСЂРЅРѕРµ" href="/catalog" items={popular as CatalogItem[]} />
        {continueWatching.length > 0 && <CatalogRail title="РџСЂРѕРґРѕР»Р¶РёС‚СЊ РїСЂРѕСЃРјРѕС‚СЂ" href="/catalog" items={continueWatching} showProgress />}
        {favorites.length > 0 && <CatalogRail title="РњРѕР№ СЃРїРёСЃРѕРє" href="/favorites" items={favorites} />}
        <CatalogRail title="Р¤РёР»СЊРјС‹" href="/catalog?category=movie" items={movies as CatalogItem[]} />
        <CatalogRail title="РЎРµСЂРёР°Р»С‹" href="/catalog?category=series" items={series as CatalogItem[]} />
        <CatalogRail title="РђРЅРёРјРµ" href="/catalog?category=anime" items={anime as CatalogItem[]} />
        <CatalogRail title="РњСѓР»СЊС‚С„РёР»СЊРјС‹" href="/catalog?category=cartoon" items={cartoons as CatalogItem[]} />
      </div>
    </div>
  );
}

function calculateOverallPercent(item: any, rows: any[]) {
  const localEpisodeCount = item.seasons?.reduce((sum: number, season: any) => sum + season.episodes.length, 0) ?? 0;
  let totalEpisodes = localEpisodeCount;

  if (!totalEpisodes && item.kodikSources?.length) {
    const totals = item.kodikSources.map((source: any) => {
      const seasons = source.seasonsJson && typeof source.seasonsJson === "object" ? source.seasonsJson : null;
      if (!seasons) return 0;
      return Object.values(seasons as Record<string, any>).reduce((sum: number, season: any) => {
        return sum + Object.keys(season?.episodes || {}).length;
      }, 0);
    });
    totalEpisodes = Math.max(0, ...totals);
  }

  if (!totalEpisodes) totalEpisodes = item.type === "movie" ? 1 : 0;
  if (!totalEpisodes) return 0;

  const uniqueCompleted = new Set(
    rows.filter((row: any) => row.completed).map((row: any) => `${row.seasonNumber}:${row.episodeNumber}`)
  ).size;
  const current = rows.find((row: any) => !row.completed);
  const partial = current?.durationSeconds
    ? Math.max(0, Math.min(0.999, current.positionSeconds / current.durationSeconds))
    : 0;

  return Math.max(0, Math.min(100, Math.round(((uniqueCompleted + partial) / totalEpisodes) * 100)));
}

function getPreferredCategory(progressRows: any[], favoriteRows: any[]) {
  const score = new Map<string, number>();
  for (const row of progressRows) {
    const category = row.anime?.category;
    if (category) score.set(category, (score.get(category) ?? 0) + 3);
  }
  for (const row of favoriteRows) {
    const category = row.anime?.category;
    if (category) score.set(category, (score.get(category) ?? 0) + 2);
  }
  return [...score.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "anime";
}

function dedupeItems(items: CatalogItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function ToriiPulse({
  viewers,
  categories,
}: {
  viewers: number;
  categories: { movie: number; series: number; anime: number; cartoon: number };
}) {
  const categoryLabels = [
    ["movie", "Р¤РёР»СЊРјС‹", categories.movie],
    ["series", "РЎРµСЂРёР°Р»С‹", categories.series],
    ["anime", "РђРЅРёРјРµ", categories.anime],
    ["cartoon", "РњСѓР»СЊС‚С„РёР»СЊРјС‹", categories.cartoon],
  ] as const;
  return (
    <section className="pulse-panel">
      <div className="pulse-main">
        <div className="pulse-ring"><span /></div>
        <div>
          <div className="pulse-kicker">Nonoki PULSE <span>РђРљРўРР’РќРћРЎРўР¬ В· 15 РњРРќ</span></div>
          <strong>{viewers}</strong>
          <p>{viewers === 1 ? "Р°РєС‚РёРІРЅС‹Р№ Р·СЂРёС‚РµР»СЊ" : "Р°РєС‚РёРІРЅС‹С… Р·СЂРёС‚РµР»РµР№"}</p>
        </div>
      </div>
      <div className="pulse-categories">
        {categoryLabels.map(([key, label, value]) => (
          <div key={key} className="pulse-stat"><span>{label}</span><strong>{value}</strong></div>
        ))}
      </div>
    </section>
  );
}

function CatalogRail({ title, href, items, showProgress = false }: { title: string; href: string; items: CatalogItem[]; showProgress?: boolean }) {
  if (!items.length) return null;
  return (
    <section className="home-rail">
      <div className="rail-head">
        <h2>{title}</h2>
        <Link href={href}>Р’СЃРµ <span>в†’</span></Link>
      </div>
      <div className="rail-track">
        {items.map((item) => <HomeCard key={item.id} item={item} showProgress={showProgress} />)}
      </div>
    </section>
  );
}

function HomeCard({ item, showProgress = false }: { item: CatalogItem; showProgress?: boolean }) {
  const episodes = item.seasons.reduce((n, season) => n + season.episodes.length, 0);
  const continueHref = item.progress
    ? `/anime/${item.slug}?${item.progress.seasonNumber > 0 ? `season=${item.progress.seasonNumber}&` : ""}ep=${item.progress.episodeNumber}`
    : `/anime/${item.slug}`;
  const progressPercent = item.progress?.overallPercent ?? 0;
  return (
    <Link href={continueHref} className={`home-card ${showProgress ? "home-card-progress" : ""}`}>
      <div className="home-card-media">
        <img src={item.posterUrl || fallbackPoster} alt={item.title} loading="lazy" />
        <span className="home-card-overlay" aria-hidden="true" />
        <span className="home-card-tag">{categoryLabel(item.category)}</span>
        <span className="home-card-play" aria-hidden="true">в–¶</span>
      </div>
      <div className="home-card-title">{item.title}</div>
      <div className="home-card-meta">
        {item.progress ? (
          <>
            {item.progress.seasonNumber > 0 && <><span>РЎРµР·РѕРЅ {item.progress.seasonNumber}</span><span>В·</span></>}
            <span>РЎРµСЂРёСЏ {item.progress.episodeNumber}</span><span>В·</span><span>{progressPercent}% РїСЂРѕСЃРјРѕС‚СЂРµРЅРѕ</span>
          </>
        ) : (
          <>
            <span>{item.year ?? "вЂ”"}</span><span>В·</span><span>{typeLabel(item.type)}</span>
            {episodes > 0 && <><span>В·</span><span>{episodes} СЃРµСЂРёР№</span></>}
          </>
        )}
      </div>
      {showProgress && item.progress?.durationSeconds ? (
        <div className="home-progress" aria-label={`РџСЂРѕСЃРјРѕС‚СЂРµРЅРѕ ${progressPercent}%`}>
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      ) : null}
    </Link>
  );
}
