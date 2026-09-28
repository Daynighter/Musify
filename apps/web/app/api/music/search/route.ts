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

function getBestArtwork(song: any): string | undefined {\n  const thumbnails = [\n    ...(song.thumbnails ?? []),\n    ...(song.thumbnail ?? []),\n  ].filter((t: any) => t?.url);\n\n  const urls = thumbnails.map((t: any) => t.url as string);\n  const preferred = urls.find((url) => /w1200|w1000|w800|w600|w500|w400|maxresdefault|sddefault/i.test(url));\n  const source = preferred ?? urls[urls.length - 1];\n  if (!source) return undefined;\n\n  // YouTube Music thumbnails commonly expose a 120x120-ish variant.\n  // Request the largest standard image variant without changing the image identity.\n  return source\n    .replace(/=w\\d+-h\\d+[^&]*/i, "=w1200-h1200-l90-rj")\n    .replace(/=s\\d+[^&]*/i, "=s1200")\n    .replace(/([?&])w=\\d+(&h=\\d+)?/i, "$1w=1200")\n    .replace(/([?&])h=\\d+(&w=\\d+)?/i, "$1h=1200");\n}\n\nexport async function GET(req: NextRequest) {
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
