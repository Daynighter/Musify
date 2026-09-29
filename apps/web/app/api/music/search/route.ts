import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MusicItem = { videoId: string; title: string; artist: string; album?: string; artwork?: string };

let clientPromise: Promise<Innertube> | undefined;

function getClient() {
  clientPromise ??= Innertube.create({\n    player_id: "0004de42",\n    lang: "es",\n    location: "ES",\n  });
  return clientPromise;
}

function getBestArtwork(song: any): string | undefined {
  const thumbnails = [
    ...(song.thumbnails ?? []),
    ...(song.thumbnail ?? []),
  ].filter((item: any) => item?.url);

  const urls = thumbnails.map((item: any) => item.url as string);
  const source =
    urls.find((url) => /maxresdefault|w1200|w1000|w800|w600|w500|w400|sddefault/i.test(url)) ??
    urls[urls.length - 1];

  if (!source) return undefined;

  return source
    .replace(/=w\d+-h\d+[^&]*/i, "=w1200-h1200-l90-rj")
    .replace(/=s\d+[^&]*/i, "=s1200")
    .replace(/([?&])w=\d+(&h=\d+)?/i, "$1w=1200")
    .replace(/([?&])h=\d+(&w=\d+)?/i, "$1h=1200");
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ items: [] });

  try {
    const yt = await getClient();
    const search = await yt.music.search(q, { type: "song" });
    const contents = search.songs?.contents ?? [];

    const items: MusicItem[] = contents
      .map((song: any) => ({
        videoId: song.id,
        title: song.title ?? "Sin título",
        artist:
          song.artists?.map((artist: any) => artist.name).join(", ") ||
          song.author?.name ||
          "YouTube Music",
        album: song.album?.name,
        artwork: getBestArtwork(song),
      }))
      .filter((item: MusicItem) => Boolean(item.videoId))
      .slice(0, 20);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Mfly InnerTube search failed:", error);
    return NextResponse.json({ error: "Music provider is unavailable", items: [] }, { status: 502 });
  }
}