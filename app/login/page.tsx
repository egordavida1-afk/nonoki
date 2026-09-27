import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { loginUser } from "../auth/actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: { error?: string; blocked?: string; exists?: string; next?: string } }) {
  const next = searchParams.next || "/";
  const adminLogin = next.startsWith("/admin");
  const posters = await prisma.anime.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 6,
    select: { id: true, title: true, posterUrl: true, year: true },
  });

  return (
    <div className="auth-page">
      <section className="auth-visual" aria-hidden="true">
        <div className="auth-visual-copy">
          <span className="eyebrow">NONOKI</span>
          <h2>Истории, к которым хочется возвращаться.</h2>
          <p>Фильмы, сериалы и аниме — в одном спокойном пространстве.</p>
        </div>
        <div className="auth-poster-wall">
          {posters.map((poster) => (
            <img key={poster.id} src={poster.posterUrl || "https://placehold.co/300x450/101620/9ca5b8?text=Nonoki"} alt="" loading="eager" />
          ))}
        </div>
      </section>

      <section className="auth-card auth-card-modern">
        <div className="page-head"><span className="eyebrow">{adminLogin ? "ADMIN" : "ДОБРО ПОЖАЛОВАТЬ"}</span><h1>Вход</h1><p>Войди, чтобы смотреть фильмы, сериалы и аниме.</p></div>
        <form action={loginUser} className="panel">
          <input type="hidden" name="next" value={next} />
          {searchParams.error && <p className="form-error">Логин/почта или пароль указаны неверно.</p>}
          {searchParams.exists && <p className="form-error">Аккаунт уже есть — войди под ним.</p>}
          {searchParams.blocked && <p className="form-error">Слишком много попыток. Попробуй позже.</p>}
          <div className="field"><label>Email или логин</label><input name="login" type="text" required maxLength={160} autoComplete="username" /></div>
          <div className="field"><label>Пароль</label><input name="password" type="password" required minLength={8} maxLength={128} autoComplete="current-password" /></div>
          <button className="btn" type="submit" style={{ width: "100%" }}>Войти</button>
        </form>
        {!adminLogin && <p className="auth-note">Нет аккаунта? <Link href={`/register?next=${encodeURIComponent(next)}`}>Зарегистрироваться →</Link></p>}
      </section>
    </div>
  );
}
