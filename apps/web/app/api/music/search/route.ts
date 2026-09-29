import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MusicItem = {
  videoId: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
};

let clientPromise: Promise<Innertube> | undefined;

function getClient() {
  clientPromise ??= Innertube.create({
    lang: "es",
    location: "ES",
  });

  return clientPromise;
}

function getBestArtwork(song: any): string | undefined {
  const thumbnails = [
    ...(song?.thumbnails ?? []),
    ...(song?.thumbnail ?? []),
  ].filter((item: any) => item?.url);

  const urls = thumbnails.map((item: any) => String(item.url));
  const source =
    urls.find((url) =>
      /maxresdefault|w1200|w1000|w800|w600|w500|w400|sddefault/i.test(url),
    ) ?? urls[urls.length - 1];

  if (!source) return undefined;

  return source
    .replace(/=w\d+-h\d+[^&]*/i, "=w1200-h1200-l90-rj")
    .replace(/=s\d+[^&]*/i, "=s1200")
    .replace(/([?&])w=\d+(&h=\d+)?/i, "$1w=1200")
    .replace(/([?&])h=\d+(&w=\d+)?/i, "$1h=1200");
}

function getArtist(song: any) {
  if (Array.isArray(song?.artists)) {
    const artists = song.artists
      .map((artist: any) => artist?.name)
      .filter(Boolean)
      .join(", ");

    if (artists) return artists;
  }

  return (
    song?.author?.name ||
    song?.owner?.name ||
    song?.channel?.name ||
    "YouTube Music"
  );
}

function normalizeSong(song: any): MusicItem | null {
  const videoId = song?.id;
  const title = song?.title;

  if (!videoId || !title) return null;

  return {
    videoId: String(videoId),
    title: String(title),
    artist: getArtist(song),
    album: song?.album?.name,
    artwork: getBestArtwork(song),
  };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ items: [] });
  }

  try {
    const yt = await getClient();

    // Primero buscamos en YouTube Music filtrando específicamente por canciones.
    // youtubei.js expone las canciones como MusicShelf.contents.
    const musicSearch = await yt.music.search(q, { type: "song" });
    let items = (musicSearch.songs?.contents ?? [])
      .map(normalizeSong)
      .filter((item): item is MusicItem => Boolean(item));

    // Si YouTube Music no devuelve canciones, usamos la búsqueda general como
    // respaldo para no dejar la cuadrícula vacía.
    if (!items.length) {
      const videoSearch = await yt.search(q, { type: "video" });
      items = Array.from(videoSearch.videos ?? [])
        .map((video: any) => ({
          videoId: String(video.id ?? ""),
          title: String(video.title ?? "Sin título"),
          artist:
            video.author?.name ||
            video.owner?.name ||
            video.channel?.name ||
            "YouTube",
          artwork: getBestArtwork(video),
        }))
        .filter((item: MusicItem) => Boolean(item.videoId));
    }

    // Evitamos duplicados y mantenemos una cuadrícula manejable.
    const unique = Array.from(
      new Map(items.map((item) => [item.videoId, item])).values(),
    ).slice(0, 20);

    return NextResponse.json({ items: unique });
  } catch (error) {
    console.error("Musify music search failed:", error);

    return NextResponse.json(
      { error: "Music provider is unavailable", items: [] },
      { status: 502 },
    );
  }
}
