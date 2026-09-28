import { NextRequest, NextResponse } from "next/server";

const INNERTUBE_URL = "https://music.youtube.com/youtubei/v1/search?prettyPrint=false";
const CLIENT_VERSION = "1.20260915.01.00";

type TextRun = { text?: string };
type Renderer = Record<string, any>;

function textOf(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textOf).join("");
  if (Array.isArray(value.runs)) return value.runs.map((r: TextRun) => r.text || "").join("");
  return value.simpleText || value.text || "";
}

function findRenderers(node: any, out: Renderer[] = []): Renderer[] {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    for (const item of node) findRenderers(item, out);
    return out;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "musicResponsiveListItemRenderer" || key === "videoRenderer") {
      out.push(value as Renderer);
    } else {
      findRenderers(value, out);
    }
  }
  return out;
}

function mapItem(renderer: Renderer) {
  const videoId = renderer.videoId;
  const flex = renderer.flexColumns || [];
  const title =
    textOf(renderer.title) ||
    textOf(flex?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text) ||
    "Sin título";

  const second = flex?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text;
  const secondText = textOf(second);
  const runs = second?.runs || [];
  const artist = runs?.[0]?.text || secondText.split(" • ")[0] || "YouTube Music";

  const thumbnails =
    renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
    renderer.thumbnail?.thumbnails ||
    [];

  return {
    videoId,
    title,
    artist,
    album: secondText.includes(" • ") ? secondText.split(" • ").slice(-1)[0] : undefined,
    artwork: thumbnails.at(-1)?.url,
  };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q) return NextResponse.json({ items: [] });

  const response = await fetch(INNERTUBE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "origin": "https://music.youtube.com",
      "user-agent": "Mozilla/5.0",
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: CLIENT_VERSION,
          hl: "es",
          gl: "ES",
        },
      },
      query: q,
    }),
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "El proveedor de música no respondió correctamente.", items: [] },
      { status: 502 },
    );
  }

  const data = await response.json();
  const items = findRenderers(data)
    .map(mapItem)
    .filter((item) => item.videoId)
    .filter((item, index, all) => all.findIndex((x) => x.videoId === item.videoId) === index)
    .slice(0, 15);

  return NextResponse.json({ items });
}
