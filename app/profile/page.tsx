import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user-auth";
import { updateProfile } from "./actions";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const [favoriteCount, watchedAnimeIds] = await Promise.all([
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.watchProgress.findMany({ where: { userId: user.id }, select: { animeId: true }, distinct: ["animeId"] }),
  ]);

  return (
    <div className="profile-page">
      <div className="page-head">
        <span className="eyebrow">АККАУНТ</span>
        <h1>Профиль</h1>
        <p>Настрой свой профиль Nonoki и управляй личными данными.</p>
      </div>

      {searchParams.saved && <div className="profile-success">Профиль сохранён.</div>}
      {searchParams.error === "avatar" && <div className="form-error">Фото должно быть изображением размером не больше 320 КБ.</div>}
      {searchParams.error === "nickname" && <div className="form-error">Никнейм должен быть не длиннее 32 символов.</div>}
      {searchParams.error === "avatar-url" && <div className="form-error">Укажи корректный URL изображения с http:// или https://.</div>}

      <div className="profile-layout">
        <section className="panel profile-card">
          <div className="profile-card-heading">
            <div>
              <span className="sidebar-kicker">ПРОФИЛЬ</span>
              <h2>{user.nickname?.trim() || "Пользователь Nonoki"}</h2>
              <p>{user.email}</p>
            </div>
          </div>
          <div className="profile-stats profile-stats-page">
            <div><strong>{favoriteCount}</strong><span>Избранное</span></div>
            <div><strong>{watchedAnimeIds.length}</strong><span>Просмотрено</span></div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><div><span className="sidebar-kicker">НАСТРОЙКИ</span><h2>Личные данные</h2></div></div>
          <ProfileForm action={updateProfile} nickname={user.nickname || ""} avatarUrl={user.avatarUrl || ""} />
        </section>
      </div>
    </div>
  );
}
