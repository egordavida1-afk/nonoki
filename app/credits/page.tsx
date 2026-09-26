import Link from "next/link";

export default function CreditsPage() {
  return (
    <div className="auth-card credits-card">
      <div className="page-head">
        <h1>Источники</h1>
        <p>Информация об автоматических данных каталога и внешних интеграциях.</p>
      </div>
      <div className="panel">
        <h2>TMDB</h2>
        <p className="title-desc">Метаданные фильмов, сериалов и анимации: названия, описания, постеры, даты и жанры.</p>
        <p className="title-desc">Этот продукт использует TMDB API, но не одобрен и не сертифицирован TMDB. Для коммерческого использования необходимо соблюдать условия лицензирования TMDB.</p>
      </div>
      <div className="panel">
        <h2>Kodik</h2>
        <p className="title-desc">Kodik используется отдельно как источник просмотра аниме и вариантов озвучки.</p>
        <p className="title-desc">Используемые API и плеер должны соответствовать условиям предоставившего их сервиса.</p>
      </div>
      <div className="panel">
        <h2>AnimeParsers</h2>
        <p className="title-desc">Дополнительный fallback для аниме через отдельный Python gateway, если основной источник просмотра недоступен.</p>
      </div>
      <p className="auth-note"><Link href="/catalog">← В каталог</Link></p>
    </div>
  );
}
