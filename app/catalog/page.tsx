import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user-auth";
import { categoryLabel, searchWhere, typeLabel } from "@/lib/utils";
import InfiniteCatalog from "../components_InfiniteCatalog";

export const dynamic = "force-dynamic";

const fallbackPoster = "https://placehold.co/300x450/1c1a26/a9a3b5?text=Нет+постера";
const categories = new Set(["movie", "series", "anime", "cartoon"]);

export default async function CatalogPage({ searchParams }: { searchParams: { q?: string; category?: string; genre?: string } }) {
  const q = searchParams.q?.trim() || "";
  const category = categories.has(searchParams.category || "") ? searchParams.category! : "";
  const genre = searchParams.genre?.trim() || "";
  await getCurrentUser();
  const where = { ...(category ? { category } : {}), ...(genre ? { genres: { contains: genre, mode: "insensitive" as const } } : {}), ...searchWhere(q) };
  const [items, total, genres, newReleases] = await Promise.all([
    prisma.anime.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 25, select: { id: true, slug: true, title: true, originalTitle: true, posterUrl: true, year: true, category: true, type: true } }),
    prisma.anime.count({ where }),
    prisma.genre.findMany({ orderBy: { name: "asc" }, take: 80 }),
    prisma.anime.findMany({ where: { isNew: true }, orderBy: [{ newReleaseOrder: "asc" }, { markedNewAt: "desc" }, { id: "desc" }], take: 8, select: { id: true, slug: true, title: true, posterUrl: true, year: true, category: true, type: true } }),
  ]);
  const initialItems = items.slice(0, 24);
  const hasMore = items.length > 24;
  const categoryTitle = category ? categoryLabel(category) : q || genre ? "Результаты поиска" : "Каталог";

  return (
    <div className="catalog-layout">
      <section className="catalog-main">
        <div className="page-head catalog-head"><div><h1>{categoryTitle}</h1><p>{q ? `Результаты для «${q}».` : category ? `Новинки и просмотр в разделе «${categoryTitle}».` : "Фильмы, сериалы, мультфильмы и аниме в одном каталоге."}</p></div><span className="catalog-count">{total}</span></div>
        <form className="search-panel" method="get" action="/catalog">
          <input name="q" defaultValue={q} placeholder="Поиск по названию, оригинальному названию..." aria-label="Поиск" autoComplete="off" />
          <select name="category" defaultValue={category} aria-label="Раздел"><option value="">Все разделы</option>{["movie","series","anime","cartoon"].map((value) => <option key={value} value={value}>{categoryLabel(value)}</option>)}</select>
          <select name="genre" defaultValue={genre} aria-label="Жанр"><option value="">Все жанры</option>{genres.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}</select>
          <button className="btn" type="submit">Найти</button>
          {(q || category || genre) && <Link className="btn btn-secondary" href="/catalog">Сбросить</Link>}
        </form>
        {genres.length > 0 && !q && <div className="catalog-genre-strip">{genres.slice(0, 12).map((g) => <Link key={g.id} href={`/catalog?genre=${encodeURIComponent(g.name)}`} className={g.name === genre ? "active" : ""}>{g.name}</Link>)}</div>}
        {initialItems.length ? <InfiniteCatalog initialItems={initialItems} initialOffset={24} hasMore={hasMore} q={q} category={category} genre={genre} /> : <div className="empty-state">Ничего не найдено.</div>}
      </section>

      <aside className="catalog-sidebar">
        <div className="sidebar-card">
          <div className="sidebar-head"><div><span className="sidebar-kicker">СЕЙЧАС</span><h2>Новинки</h2></div><Link href="/catalog">Все →</Link></div>
          <div className="new-release-list">
            {newReleases.map((item) => <Link key={item.id} href={`/anime/${item.slug}`} className="new-release"><img src={item.posterUrl || fallbackPoster} alt={item.title} loading="lazy" /><span><strong>{item.title}</strong><small>{item.year ?? "—"} · {typeLabel(item.type)}</small></span></Link>)}
          </div>
        </div>
      </aside>
    </div>
  );
}
