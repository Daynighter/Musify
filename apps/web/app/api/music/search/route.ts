import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MusicItem = {
  id: string;
  videoId?: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  previewUrl?: string;
  source: "itunes" | "youtube";
};

let clientPromise: Promise<Innertube> | undefined;

function getClient() {
  clientPromise ??= Innertube.create({ lang: "es", location: "ES" });
  return clientPromise;
}

function getBestArtwork(song: any): string | undefined {
  const thumbnails = [...(song?.thumbnails ?? []), ...(song?.thumbnail ?? [])].filter((item: any) => item?.url);
  const urls = thumbnails.map((item: any) => String(item.url));
  const source = urls.find((url) => /maxresdefault|w1200|w1000|w800|w600|w500|w400|sddefault/i.test(url)) ?? urls[urls.length - 1];
  if (!source) return undefined;
  return source
    .replace(/=w\d+-h\d+[^&]*/i, "=w1200-h1200-l90-rj")
    .replace(/=s\d+[^&]*/i, "=s1200")
    .replace(/([?&])w=\d+(&h=\d+)?/i, "$1w=1200")
    .replace(/([?&])h=\d+(&w=\d+)?/i, "$1h=1200");
}

function getArtist(song: any) {
  if (Array.isArray(song?.artists)) {
    const artists = song.artists.map((artist: any) => artist?.name).filter(Boolean).join(", ");
    if (artists) return artists;
  }
  return song?.author?.name || song?.owner?.name || song?.channel?.name || "YouTube Music";
}

async function searchITunes(q: string): Promise<MusicItem[]> {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", q);
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("country", "ES");
  url.searchParams.set("limit", "24");
  url.searchParams.set("lang", "es_es");

  const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error("iTunes Search API returned " + response.status);

  const data = (await response.json()) as { results?: any[] };

  return (data.results ?? [])
    .filter((track) => track?.trackId && track?.trackName && track?.artworkUrl100)
    .map((track) => ({
      id: String(track.trackId),
      title: String(track.trackName),
      artist: String(track.artistName ?? "Artista desconocido"),
      album: track.collectionName ? String(track.collectionName) : undefined,
      artwork: String(track.artworkUrl100).replace("100x100bb", "1200x1200bb"),
      previewUrl: track.previewUrl ? String(track.previewUrl) : undefined,
      source: "itunes" as const,
    }))
    .filter((item) => Boolean(item.previewUrl));
}

function normalizeYouTube(song: any): MusicItem | null {
  const videoId = song?.id;
  const title = song?.title;
  if (!videoId || !title) return null;
  return {
    id: String(videoId),
    videoId: String(videoId),
    title: String(title),
    artist: getArtist(song),
    album: song?.album?.name,
    artwork: getBestArtwork(song),
    source: "youtube",
  };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ items: [] });

  // iTunes es la fuente principal: devuelve canciones reales, carátulas y
  // previews de audio. No añadimos banners ni SDKs publicitarios.
  try {
    const items = await searchITunes(q);
    if (items.length) return NextResponse.json({ items });
  } catch (error) {
    console.warn("Musify iTunes search failed; trying YouTube Music:", error);
  }

  // Respaldo: si iTunes no tiene resultados, usamos YouTube Music.
  try {
    const yt = await getClient();
    const musicSearch = await yt.music.search(q, { type: "song" });
    const items = (musicSearch.songs?.contents ?? [])
      .map(normalizeYouTube)
      .filter((item): item is MusicItem => Boolean(item))
      .slice(0, 20);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Musify music search failed:", error);
    return NextResponse.json({ error: "Music provider is unavailable", items: [] }, { status: 502 });
  }
}
