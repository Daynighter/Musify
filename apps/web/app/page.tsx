"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type MusicResult = {
  videoId: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type YouTubePlayer = {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
};

type YouTubeWindow = Window & {
  YT?: {
    Player: new (elementId: string, options: Record<string, unknown>) => YouTubePlayer;
    PlayerState: { PLAYING: number };
  };
  onYouTubeIframeAPIReady?: () => void;
};

const YOUTUBE_API = "https://www.youtube.com/iframe_api";

const ICONS = {
  plus: "M12 5v14M5 12h14",
  play: "M8 5v14l11-7z",
  pause: "M8 6h3v12H8zM13 6h3v12h-3z",
  menu: "M4 6h16M4 12h16M4 18h16",
  more: "M6 12h.01M12 12h.01M18 12h.01",
  music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  previous: "M6 6v12M18 6l-8 6 8 6z",
  next: "M18 6v12M6 6l8 6-8 6z",
  send: "M5 12l5 5L20 7",
  search: "m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  gamepad: "M6 11h4m-2-2v4m8-2h.01M19 8h.01M7.8 18h8.4a3 3 0 0 0 2.85-2.06l1.35-4.05A4 4 0 0 0 16.6 6H7.4a4 4 0 0 0-3.8 5.89l1.35 4.05A3 3 0 0 0 7.8 18Z",
  sparkles: "m12 3-1.2 4.1L7 8.3l3.8 1.2L12 14l1.2-4.5L17 8.3l-3.8-1.2L12 3Zm7 10-.7 2.3L16 16l2.3.7L19 19l.7-2.3L22 16l-2.3-.7L19 13Z",
  code: "m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14",
};

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

function ResultCard({
  item,
  playing,
  onPlay,
}: {
  item: MusicResult;
  playing: boolean;
  onPlay: () => void;
}) {
  const artwork =
    item.artwork ||
    `https://i.ytimg.com/vi/${encodeURIComponent(item.videoId)}/hqdefault.jpg`;

  return (
    <article className={`musicCard ${playing ? "isPlaying" : ""}`}>
      <button
        type="button"
        className="artworkButton"
        aria-label={`${playing ? "Pausar" : "Reproducir"} ${item.title}`}
        onClick={onPlay}
      >
        <div className="artwork">
          <img src={artwork} alt="" loading="lazy" />
          <span className="playButton">
            <Icon path={playing ? ICONS.pause : ICONS.play} />
          </span>
        </div>
      </button>
      <div className="cardMeta">
        <b title={item.title}>{item.title}</b>
        <span title={item.artist}>{item.artist}</span>
        {item.album && <small title={item.album}>{item.album}</small>}
      </div>
    </article>
  );
}

function PlayerBar({
  current,
  playing,
  progress,
  duration,
  onPrevious,
  onToggle,
  onNext,
  onSeek,
}: {
  current: MusicResult | null;
  playing: boolean;
  progress: number;
  duration: number;
  onPrevious: () => void;
  onToggle: () => void;
  onNext: () => void;
  onSeek: (ratio: number) => void;
}) {
  return (
    <footer className={`playerBar ${current ? "hasTrack" : ""}`}>
      {!current ? (
        <div className="playerEmpty">Musify está listo para reproducir.</div>
      ) : (
        <>
          <div className="now">
            <div className="mini">
              {current.artwork ? (
                <img src={current.artwork} alt="" />
              ) : (
                <Icon path={ICONS.music} />
              )}
            </div>
            <div className="nowText">
              <b title={current.title}>{current.title}</b>
              <span title={current.artist}>{current.artist}</span>
            </div>
          </div>

          <div className="player">
            <div className="controls">
              <button type="button" aria-label="Anterior" onClick={onPrevious}>
                <Icon path={ICONS.previous} />
              </button>
              <button
                type="button"
                className="mainPlay"
                aria-label={playing ? "Pausar" : "Reproducir"}
                onClick={onToggle}
              >
                <Icon path={playing ? ICONS.pause : ICONS.play} />
              </button>
              <button type="button" aria-label="Siguiente" onClick={onNext}>
                <Icon path={ICONS.next} />
              </button>
            </div>

            <div className="progressRow">
              <span>{formatTime(progress * duration)}</span>
              <button
                type="button"
                className="progressTrack"
                aria-label="Progreso"
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  onSeek(
                    Math.min(
                      1,
                      Math.max(0, (event.clientX - rect.left) / rect.width),
                    ),
                  );
                }}
              >
                <i style={{ width: `${progress * 100}%` }} />
              </button>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </>
      )}
    </footer>
  );
}

export default function Home() {
  const player = useRef<YouTubePlayer | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<MusicResult[]>([]);
  const [queue, setQueue] = useState<MusicResult[]>([]);
  const [current, setCurrent] = useState<MusicResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [chat, setChat] = useState<Message[]>([]);
  const searchAbort = useRef<AbortController | null>(null);

  const currentIndex = useMemo(
    () =>
      current
        ? queue.findIndex((item) => item.videoId === current.videoId)
        : -1,
    [current, queue],
  );

  const playResult = useCallback(
    (item: MusicResult, source: MusicResult[] = results) => {
      setQueue(source);
      setCurrent(item);
      setPlaying(true);
      setProgress(0);
      setDuration(0);

      if (player.current) {
        player.current.loadVideoById(item.videoId);
        player.current.playVideo();
      }
    },
    [results],
  );

  const playIndex = useCallback(
    (index: number) => {
      if (!queue.length) return;
      playResult(queue[(index + queue.length) % queue.length], queue);
    },
    [playResult, queue],
  );

  const next = useCallback(() => {
    if (currentIndex >= 0) playIndex(currentIndex + 1);
  }, [currentIndex, playIndex]);

  const previous = useCallback(() => {
    if (currentIndex >= 0) playIndex(currentIndex - 1);
  }, [currentIndex, playIndex]);

  useEffect(() => {
    const win = window as YouTubeWindow;

    const initPlayer = () => {
      if (!win.YT?.Player || player.current) return;

      player.current = new win.YT.Player("musify-youtube-player", {
        width: "1",
        height: "1",
        playerVars: {
          playsinline: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => undefined,
          onStateChange: (event: { data: number; target: YouTubePlayer }) => {
            setPlaying(event.data === win.YT?.PlayerState.PLAYING);
            setDuration(event.target.getDuration?.() || 0);
          },
          onError: () => setPlaying(false),
        },
      });
    };

    if (win.YT?.Player) {
      initPlayer();
      return;
    }

    const previousReady = win.onYouTubeIframeAPIReady;
    win.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      initPlayer();
    };

    if (!document.querySelector(`script[src="${YOUTUBE_API}"]`)) {
      const script = document.createElement("script");
      script.src = YOUTUBE_API;
      script.async = true;
      document.head.appendChild(script);
    }

    return () => {
      if (win.onYouTubeIframeAPIReady) {
        win.onYouTubeIframeAPIReady = previousReady;
      }
    };
  }, []);

  useEffect(() => {
    if (!current || !player.current) return;
    player.current.loadVideoById(current.videoId);
  }, [current]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const yt = player.current;
      if (!yt) return;

      const total = yt.getDuration?.() || 0;
      const elapsed = yt.getCurrentTime?.() || 0;

      if (total > 0) {
        setDuration(total);
        setProgress(Math.min(1, Math.max(0, elapsed / total)));
      }
    }, 500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>(".composer input")?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  async function search(text = query) {
    const cleanQuery = text.trim();
    if (!cleanQuery || searching) return;

    searchAbort.current?.abort();
    const controller = new AbortController();
    searchAbort.current = controller;

    setChat((messages) => [
      ...messages,
      { id: crypto.randomUUID(), role: "user", text: cleanQuery },
    ]);
    setQuery("");
    setSearching(true);

    try {
      const response = await fetch(
        `/api/music/search?q=${encodeURIComponent(cleanQuery)}`,
        {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        },
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data: { items?: MusicResult[]; error?: string } =
        await response.json();
      const items = Array.isArray(data.items) ? data.items : [];

      setResults(items);
      setQueue(items);
      setCurrent(null);
      setPlaying(false);
      setProgress(0);
      setDuration(0);

      setChat((messages) => [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.error
            ? "No pude buscar música ahora mismo."
            : items.length
              ? `Resultados para “${cleanQuery}”`
              : "No encontré canciones para esa búsqueda.",
        },
      ]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      setChat((messages) => [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "No se pudo completar la búsqueda. Inténtalo de nuevo.",
        },
      ]);
    } finally {
      if (searchAbort.current === controller) {
        searchAbort.current = null;
        setSearching(false);
      }
    }
  }

  function reset() {
    searchAbort.current?.abort();
    player.current?.stopVideo?.();
    setChat([]);
    setQuery("");
    setResults([]);
    setQueue([]);
    setCurrent(null);
    setPlaying(false);
    setProgress(0);
    setDuration(0);
    setSearching(false);
  }

  function togglePlayback() {
    if (!player.current || !current) return;

    if (playing) {
      player.current.pauseVideo();
      setPlaying(false);
    } else {
      player.current.playVideo();
      setPlaying(true);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbarSide">
          <button
            className="iconButton"
            type="button"
            onClick={reset}
            aria-label="Nuevo chat"
            title="Nuevo chat"
          >
            <Icon path={ICONS.plus} />
          </button>
        </div>

        <div className="brand">Musify</div>

        <div className="topbarSide right">
          <button
            className="iconButton"
            type="button"
            onClick={reset}
            aria-label="Limpiar chat"
            title="Limpiar chat"
          >
            <Icon path={ICONS.more} />
          </button>
        </div>
      </header>

      <main>
        <section className="chat">
          {!chat.length ? (
            <div className="emptyState">
              <div className="emptyIcon">
                <Icon path={ICONS.music} />
              </div>

              <h1>¿Qué quieres escuchar?</h1>

              <p>
                Busca una canción, artista, álbum o estilo y reproduce la música
                directamente desde Musify.
              </p>

              <div className="quickActions">
                <button
                  className="quickAction"
                  type="button"
                  onClick={() => void search("Música electrónica")}
                >
                  <Icon path={ICONS.music} />
                  <span>Música electrónica</span>
                </button>

                <button
                  className="quickAction"
                  type="button"
                  onClick={() => void search("Pop actual")}
                >
                  <Icon path={ICONS.sparkles} />
                  <span>Pop actual</span>
                </button>

                <button
                  className="quickAction"
                  type="button"
                  onClick={() => void search("Música para estudiar")}
                >
                  <Icon path={ICONS.code} />
                  <span>Para estudiar</span>
                </button>

                <button
                  className="quickAction"
                  type="button"
                  onClick={() => void search("Bandas sonoras")}
                >
                  <Icon path={ICONS.gamepad} />
                  <span>Bandas sonoras</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="messages">
              {chat.map((message, index) => (
                <div
                  className={`message ${message.role}`}
                  key={message.id}
                >
                  {message.role === "user" ? (
                    <div className="userBubble">{message.text}</div>
                  ) : (
                    <div className="assistant">
                      <div className="assistantLabel">
                        <span className="assistantMark">
                          <Icon path={ICONS.music} />
                        </span>
                        <span>Musify</span>
                      </div>

                      <div className="assistantText">{message.text}</div>

                      {index === chat.length - 1 && results.length > 0 && (
                        <div className="resultsGrid">
                          {results.map((item) => (
                            <ResultCard
                              key={item.videoId}
                              item={item}
                              playing={
                                current?.videoId === item.videoId && playing
                              }
                              onPlay={() => playResult(item)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {searching && (
                <div className="message assistant">
                  <div className="assistantLabel">
                    <span className="assistantMark">
                      <Icon path={ICONS.music} />
                    </span>
                    <span>Buscando música</span>
                  </div>
                  <div className="loading">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <div className="composerArea">
        <div className="composerWrap">
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              void search();
            }}
          >
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busca una canción o artista..."
              aria-label="Buscar música"
            />

            <button
              className="sendButton"
              type="submit"
              aria-label="Buscar"
              disabled={searching || !query.trim()}
            >
              <Icon path={ICONS.send} />
            </button>
          </form>

          <div className="composerHint">
            Musify · búsqueda musical
          </div>
        </div>
      </div>

      <div
        id="musify-youtube-player"
        className="youtubePlayer"
        aria-hidden="true"
      />

      <PlayerBar
        current={current}
        playing={playing}
        progress={progress}
        duration={duration}
        onPrevious={previous}
        onToggle={togglePlayback}
        onNext={next}
        onSeek={(ratio) => {
          if (duration && player.current) {
            player.current.seekTo(duration * ratio, true);
            setProgress(ratio);
          }
        }}
      />
    </div>
  );
}
