"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { categoryLabel, typeLabel } from "@/lib/utils";

type Item = { id: string; slug: string; title: string; originalTitle: string | null; posterUrl: string | null; year: number | null; category: string; type: string };
const fallbackPoster = "https://placehold.co/300x450/1c1a26/a9a3b5?text=Нет+постера";

export default function InfiniteCatalog({ initialItems, initialOffset, hasMore, q, category, genre }: { initialItems: Item[]; initialOffset: number; hasMore: boolean; q: string; category: string; genre: string }) {
  const [items, setItems] = useState(initialItems);
  const [nextOffset, setNextOffset] = useState(initialOffset);
  const [more, setMore] = useState(hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const loadMore = useCallback(async () => {
    if (loading || !more) return;
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ offset: String(nextOffset), limit: "24" });
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (genre) params.set("genre", genre);
      const response = await fetch(`/api/catalog?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("catalog request failed");
      const data = await response.json() as { items: Item[]; hasMore: boolean; nextOffset: number | null };
      setItems((current) => [...current, ...data.items.filter((item) => !current.some((existing) => existing.id === item.id))]);
      setMore(data.hasMore);
      if (data.nextOffset !== null) setNextOffset(data.nextOffset);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [category, genre, loading, more, nextOffset, q]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) void loadMore(); }, { rootMargin: "700px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="grid infinite-grid">
        {items.map((item) => <Link key={item.id} href={`/anime/${item.slug}`} className="card"><span className="card-tag">{categoryLabel(item.category)}</span><img className="card-poster" src={item.posterUrl || fallbackPoster} alt={item.title} loading="lazy" /><div className="card-body"><div className="card-title">{item.title}</div><div className="card-meta">{item.year ?? "—"} · {typeLabel(item.type)}</div></div></Link>)}
      </div>
      <div ref={sentinel} className="catalog-loader" aria-live="polite">{loading ? "Загружаем ещё…" : error ? <button className="btn btn-secondary" type="button" onClick={() => void loadMore()}>Повторить</button> : more ? "" : "Вы достигли конца каталога"}</div>
    </>
  );
}
