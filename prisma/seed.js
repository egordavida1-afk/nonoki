const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const genres = [
  ["Р‘РѕРµРІРёРє", "boevik"],
  ["РљРѕРјРµРґРёСЏ", "komediya"],
  ["Р”СЂР°РјР°", "drama"],
  ["Р¤СЌРЅС‚РµР·Рё", "fentezi"],
  ["Р¤Р°РЅС‚Р°СЃС‚РёРєР°", "fantastika"],
  ["РўСЂРёР»Р»РµСЂ", "triller"],
  ["Р РѕРјР°РЅС‚РёРєР°", "romantika"],
  ["РџСЂРёРєР»СЋС‡РµРЅРёСЏ", "priklyucheniya"],
];

async function main() {
  for (const [name, slug] of genres) {
    await prisma.genre.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }

  await prisma.anime.upsert({
    where: { slug: "nochnoy-strazh" },
    update: { category: "series" },
    create: {
      slug: "nochnoy-strazh",
      title: "РќРѕС‡РЅРѕР№ СЃС‚СЂР°Р¶",
      description: "Р”РµРјРѕ-СЃРµСЂРёР°Р» РґР»СЏ РїСЂРѕРІРµСЂРєРё РєР°С‚Р°Р»РѕРіР°. Р•РіРѕ РјРѕР¶РЅРѕ Р·Р°РјРµРЅРёС‚СЊ РёР»Рё СѓРґР°Р»РёС‚СЊ РІ Р°РґРјРёРЅРєРµ.",
      posterUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
      backgroundUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1800&q=85",
      year: 2026,
      genres: "Р¤СЌРЅС‚РµР·Рё,Р‘РѕРµРІРёРє",
      status: "ongoing",
      type: "series",
      category: "series",
      seasons: {
        create: [
          {
            number: 1,
            title: "РЎРµР·РѕРЅ 1",
            episodes: {
              create: [
                { number: 1, title: "РџСЂРѕР±СѓР¶РґРµРЅРёРµ", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: 24 },
                { number: 2, title: "РџРµСЂРІС‹Р№ РґРѕР·РѕСЂ", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: 24 },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.anime.upsert({
    where: { slug: "krasnyy-klinok-demo" },
    update: { category: "anime" },
    create: {
      slug: "krasnyy-klinok-demo",
      title: "РљСЂР°СЃРЅС‹Р№ РєР»РёРЅРѕРє",
      description: "Р”РµРјРѕ-Р°РЅРёРјРµ РґР»СЏ РїСЂРѕРІРµСЂРєРё РѕС‚РґРµР»СЊРЅРѕРіРѕ СЂР°Р·РґРµР»Р° Р°РЅРёРјРµ.",
      posterUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80",
      backgroundUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1800&q=85",
      year: 2026,
      genres: "Р¤СЌРЅС‚РµР·Рё,РџСЂРёРєР»СЋС‡РµРЅРёСЏ",
      status: "ongoing",
      type: "series",
      category: "anime",
      seasons: {
        create: [
          {
            number: 1,
            title: "РЎРµР·РѕРЅ 1",
            episodes: {
              create: [{ number: 1, title: "РџСЂРѕР±Р° РєР»РёРЅРєР°", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: 23 }],
            },
          },
        ],
      },
    },
  });

  await prisma.anime.upsert({
    where: { slug: "posledniy-reys-demo" },
    update: { category: "movie" },
    create: {
      slug: "posledniy-reys-demo",
      title: "РџРѕСЃР»РµРґРЅРёР№ СЂРµР№СЃ",
      description: "Р”РµРјРѕ-С„РёР»СЊРј, С‡С‚РѕР±С‹ СѓРІРёРґРµС‚СЊ РѕС‚РґРµР»СЊРЅС‹Р№ С‚РёРї РєРѕРЅС‚РµРЅС‚Р° РІ РєР°С‚Р°Р»РѕРіРµ.",
      posterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80",
      backgroundUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1800&q=85",
      year: 2026,
      genres: "РўСЂРёР»Р»РµСЂ,РџСЂРёРєР»СЋС‡РµРЅРёСЏ",
      status: "finished",
      type: "movie",
      category: "movie",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global", defaultAccent: "#E8A33D", buttonTextColor: "#171208" },
  });

  console.log("Р“РѕС‚РѕРІРѕ: Р±Р°Р·РѕРІС‹Рµ Р¶Р°РЅСЂС‹ Рё РґРµРјРѕ-РґР°РЅРЅС‹Рµ РґРѕР±Р°РІР»РµРЅС‹.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
