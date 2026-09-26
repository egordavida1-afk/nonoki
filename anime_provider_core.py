from __future__ import annotations

from typing import Any

from anime_parsers_ru import AnimegoParser


class AnimeProviderError(RuntimeError):
    pass


def _pick_first_search_result(results: list[dict[str, Any]], query: str) -> dict[str, Any] | None:
    clean = [item for item in results if isinstance(item, dict) and item.get("link")]
    if not clean:
        return None

    needle = " ".join(query.lower().split())
    for item in clean:
        for key in ("title", "original_title"):
            value = item.get(key)
            if isinstance(value, str) and " ".join(value.lower().split()) == needle:
                return item
    return clean[0]


def _safe_voices(parser: AnimegoParser, anime_id: str, episode: int) -> list[dict[str, Any]]:
    try:
        data = parser.get_voices(anime_id=str(anime_id), episode=max(1, int(episode)))
    except Exception:
        return []
    voices = data.get("voices") if isinstance(data, dict) else None
    return voices if isinstance(voices, list) else []


def resolve_anime(title: str, season: int = 1, episode: int = 1) -> dict[str, Any]:
    query = (title or "").strip()
    if not query:
        raise AnimeProviderError("Пустое название аниме.")

    parser = AnimegoParser(use_cache=True)
    search_results = parser.search(query=query)
    match = _pick_first_search_result(search_results, query)
    if not match:
        return {"ok": True, "found": False, "query": query, "sources": []}

    anime_id = match.get("id")
    info: dict[str, Any] = {}
    if match.get("link"):
        try:
            raw_info = parser.anime_info(url=match["link"])
            if isinstance(raw_info, dict):
                info = raw_info
        except Exception:
            info = {}

    image = info.get("image") or match.get("image")
    voices = _safe_voices(parser, str(anime_id), episode) if anime_id else []
    sources: list[dict[str, Any]] = []

    for voice in voices:
        if not isinstance(voice, dict):
            continue
        player = str(voice.get("player") or "").strip().lower()
        label = str(voice.get("label") or "Источник").strip()
        embed = voice.get("embed")
        source: dict[str, Any] = {
            "label": label,
            "player": player,
            "embed": embed,
            "kind": "embed" if embed else None,
            "stream": None,
        }

        try:
            if player == "aniboom":
                translation_id = voice.get("translation_id")
                if translation_id is not None and anime_id:
                    stream = parser.aniboom_get_stream_for_voice(
                        translation_id=str(translation_id),
                        episode=max(1, int(episode)),
                        anime_id=str(anime_id),
                    )
                    if isinstance(stream, dict):
                        source["stream"] = stream
                        source["kind"] = "stream"
            elif player == "cvh":
                cvh_id = voice.get("cvh_id")
                if cvh_id:
                    stream = parser.cvh_get_stream(
                        cvh_id=str(cvh_id),
                        season=max(1, int(season)),
                        episode=max(1, int(episode)),
                        translation=label,
                    )
                    if isinstance(stream, dict):
                        source["stream"] = stream
                        source["kind"] = "stream"
        except Exception:
            # Один источник не должен ломать все остальные.
            pass

        if source.get("embed") or source.get("stream"):
            sources.append(source)

    def source_rank(item: dict[str, Any]) -> tuple[int, int]:
        player_rank = {"cvh": 0, "aniboom": 1, "kodik": 2}.get(str(item.get("player") or ""), 3)
        direct_rank = 0 if item.get("stream") else 1
        return direct_rank, player_rank

    sources.sort(key=source_rank)

    return {
        "ok": True,
        "found": True,
        "query": query,
        "title": info.get("title") or match.get("title"),
        "original_title": info.get("other_titles") or match.get("original_title"),
        "image": image,
        "description": info.get("description"),
        "episodes": info.get("episodes"),
        "genres": info.get("genres") or [],
        "status": info.get("status"),
        "animego_id": anime_id,
        "animego_url": match.get("link"),
        "sources": sources,
    }
