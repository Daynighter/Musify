import json
import sys
from typing import Any

from innertube import InnerTube

def text(value: Any) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "".join(text(item) for item in value)
    if isinstance(value, dict):
        if isinstance(value.get("runs"), list):
            return "".join(str(run.get("text", "")) for run in value["runs"])
        return str(value.get("simpleText") or value.get("text") or "")
    return ""

def walk(value: Any):
    if isinstance(value, dict):
        for key, child in value.items():
            if key in ("musicResponsiveListItemRenderer", "videoRenderer") and isinstance(child, dict):
                yield child
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)

def first_thumbnail(renderer: dict) -> str | None:
    thumbnail = renderer.get("thumbnail") or {}
    node = thumbnail.get("musicThumbnailRenderer") or thumbnail
    thumbs = node.get("thumbnail", {}).get("thumbnails") or node.get("thumbnails") or []
    return thumbs[-1].get("url") if thumbs else None

def map_renderer(renderer: dict) -> dict | None:
    video_id = renderer.get("videoId")
    if not video_id:
        endpoint = renderer.get("navigationEndpoint") or {}
        video_id = (endpoint.get("watchEndpoint") or {}).get("videoId")
    if not video_id:
        return None

    flex = renderer.get("flexColumns") or []
    title = text(renderer.get("title"))
    if not title and flex:
        title = text((flex[0].get("musicResponsiveListItemFlexColumnRenderer") or {}).get("text"))

    secondary = {}
    if len(flex) > 1:
        secondary = flex[1].get("musicResponsiveListItemFlexColumnRenderer") or {}
    secondary_text = text(secondary.get("text"))
    parts = [part.strip() for part in secondary_text.split("•") if part.strip()]
    runs = (secondary.get("text") or {}).get("runs") or []
    artist = runs[0].get("text", "").strip() if runs else (parts[0] if parts else "YouTube Music")
    album = parts[-1] if len(parts) > 1 else None

    return {
        "videoId": video_id,
        "title": title or "Sin título",
        "artist": artist or "YouTube Music",
        "album": album,
        "artwork": first_thumbnail(renderer),
    }

def main() -> None:
    query = " ".join(sys.argv[1:]).strip()
    if not query:
        print(json.dumps({"items": []}, ensure_ascii=False))
        return

    client = InnerTube("WEB_REMIX")
    data = client.search(query=query)

    items = []
    seen = set()
    for renderer in walk(data):
        item = map_renderer(renderer)
        if item and item["videoId"] not in seen:
            seen.add(item["videoId"])
            items.append(item)
        if len(items) >= 20:
            break

    print(json.dumps({"items": items}, ensure_ascii=False))

if __name__ == "__main__":
    main()
