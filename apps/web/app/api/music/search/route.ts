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
  clientPromise ??= Innertube.create();
  return clientPromise;
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
        artwork:
          song.thumbnails?.[song.thumbnails.length - 1]?.url ??
          song.thumbnail?.[song.thumbnail.length - 1]?.url,
      }))
      .filter((item: MusicItem) => Boolean(item.videoId))
      .slice(0, 20);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Mfly InnerTube search failed:", error);
    return NextResponse.json(
      { error: "Music provider is unavailable", items: [] },
      { status: 502 },
    );
  }
}
