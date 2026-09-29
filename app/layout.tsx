import type { Metadata, Viewport } from "next";
import { Unbounded, Manrope } from "next/font/google";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user-auth";
import { logoutUser } from "./auth/actions";
import "./globals.css";

const display = Unbounded({ subsets: ["latin", "cyrillic"], weight: ["500", "700", "900"], variable: "--font-display" });
const body = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "700"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Nonoki — фильмы, сериалы, аниме и мультфильмы",
  description: "Nonoki — фильмы, сериалы, аниме и мультфильмы в одном месте.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#080a10" };

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, user] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "global" } }),
    getCurrentUser(),
  ]);
  const background = settings?.backgroundUrl || "/bg-collage.svg";
  const accent = settings?.defaultAccent || "#8b5cf6";
  const buttonText = settings?.buttonTextColor || "#ffffff";
  const avatarLetter = user?.nickname?.trim().slice(0, 1).toUpperCase() || user?.email?.slice(0, 1).toUpperCase() || "Т";
  const [favoriteCount, watchedAnimeIds] = user
    ? await Promise.all([
        prisma.favorite.count({ where: { userId: user.id } }),
        prisma.watchProgress.findMany({ where: { userId: user.id }, select: { animeId: true }, distinct: ["animeId"] }),
      ])
    : [0, []];

  return (
    <html lang="ru">
      <body className={`${display.variable} ${body.variable}`} style={{ "--accent": accent, "--accent-ink": buttonText } as React.CSSProperties}>
        <div className="bg-collage" aria-hidden="true" style={{ backgroundImage: `url("${background}")` }} />
        <div className="site-frame">
          <header className="site-header">
            <Link href="/" className="brand" aria-label="METRA — главная">
              <img className="metra-logo" src="/metra-logo.svg" alt="METRA" />
            </Link>

            <nav className="site-nav" aria-label="Основная навигация">
              <Link href="/">Главная</Link>
              <Link href="/catalog?category=movie">Фильмы</Link>
              <Link href="/catalog?category=series">Сериалы</Link>
              <Link href="/catalog?category=anime">Аниме</Link>
              <Link href="/catalog?category=cartoon">Мультфильмы</Link>
            </nav>

            <div className="header-actions">
              <Link href="/catalog" className="header-search" aria-label="Поиск" title="Поиск">
                <span aria-hidden="true">⌕</span>
                <span className="header-search-text">Поиск</span>
              </Link>
              <Link href="/favorites" className="header-icon" aria-label="Избранное" title="Избранное">♡</Link>
              {user ? (
                <details className="profile-menu">
                  <summary className="header-avatar" aria-label={`Профиль ${user.email}`} title="Профиль">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : avatarLetter}
                  </summary>
                  <div className="profile-popover">
                    <div className="profile-popover-head">
                      <div className="profile-popover-avatar">
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : avatarLetter}
                      </div>
                      <div className="profile-popover-user">
                        <strong>{user.nickname?.trim() || "Пользователь"}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>
                    <div className="profile-stats">
                      <Link href="/favorites"><strong>{favoriteCount}</strong><span>Избранное</span></Link>
                      <Link href="/profile"><strong>{watchedAnimeIds.length}</strong><span>Просмотрено</span></Link>
                    </div>
                    <div className="profile-links">
                      <Link href="/profile">Профиль и настройки</Link>
                    </div>
                    <form action={logoutUser}>
                      <button className="profile-logout" type="submit">Выйти</button>
                    </form>
                  </div>
                </details>
              ) : (
                <Link href="/login" className="header-login">Войти</Link>
              )}
            </div>
          </header>

          <main>{children}</main>

          <footer className="site-footer">
            <span>Nonoki · фильмы, сериалы, аниме и мультфильмы.</span>
            <Link className="source-link" href="/credits">Источники</Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
