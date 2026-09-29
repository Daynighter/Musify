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
  settings: "M12 3v2M12 19v2M3 12h2M19 12h2",
  previous: "M6 6v12M18 6l-8 6 8 6z",
  next: "M18 6v12M6 6l8 6-8 6z",
  send: "M5 12l5 5L20 7",
  share: "M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14",
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
  const artwork = item.artwork || `https://i.ytimg.com/vi/${item.videoId}/maxresdefault.jpg`;

  return (
    <article className={`musicCard ${playing ? "isPlaying" : ""}`} onClick={onPlay}>
      <div className="artwork">
        <img src={artwork} alt="" loading="lazy" />
        <button
          type="button"
          aria-label={playing ? "Pausar" : "Reproducir"}
          onClick={(event) => {
            event.stopPropagation();
            onPlay();
          }}
        >
          <Icon path={playing ? ICONS.pause : ICONS.play} />
        </button>
      </div>
      <div className="cardMeta">
        <b title={item.title}>{item.title}</b>
        <span title={item.artist}>{item.artist}</span>
        {item.album && <small title={item.album}>{item.album}</small>}
      </div>
    </article>
  );
}

function Sidebar({ recent, onReset }: { recent: string; onReset: () => void }) {
  return (
    <aside className="sidebar">
      <div className="sidebarTop">
        <button className="brandButton" aria-label="Mfly">M</button>
        <button className="newChat" onClick={onReset}>
          <Icon path={ICONS.plus} />
          <span>Nuevo chat</span>
          <kbd>⌘ K</kbd>
        </button>
      </div>

      <div className="sideSection">
        <span className="sideLabel">Recientes</span>
        <button className="historyItem active" onClick={onReset}>
          <Icon path={ICONS.play} />
          <span>{recent || "Explorar música"}</span>
        </button>
      </div>

      <div className="sidebarBottom">
        <button className="sideLink">
          <Icon path={ICONS.settings} />
          <span>Ajustes</span>
        </button>
        <button className="profile">
          <span className="avatar">M</span>
          <span>Mfly</span>
          <span>•••</span>
        </button>
      </div>
    </aside>
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
        <div className="playerEmpty">Mfly está listo para reproducir.</div>
      ) : (
        <>
          <div className="now">
            <div className="mini">
              {current.artwork ? <img src={current.artwork} alt="" /> : current.title[0]}
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
                  onSeek(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)));
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
    () => (current ? queue.findIndex((item) => item.videoId === current.videoId) : -1),
    [current, queue],
  );

  const playResult = useCallback((item: MusicResult, source: MusicResult[] = results) => {
    setQueue(source);
    setCurrent(item);
    setPlaying(true);

    if (player.current) {
      player.current.loadVideoById(item.videoId);
      player.current.playVideo();
    }
  }, [results]);

  const playIndex = useCallback((index: number) => {
    if (!queue.length) return;
    playResult(queue[(index + queue.length) % queue.length], queue);
  }, [playResult, queue]);

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

      player.current = new win.YT.Player("mfly-youtube-player", {
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
          onReady: () => {
            if (current) player.current?.loadVideoById(current.videoId);
          },
          onStateChange: (event: { data: number; target: YouTubePlayer }) => {
            const state = event.data;
            setPlaying(state === win.YT?.PlayerState.PLAYING);
            setDuration(event.target.getDuration?.() || 0);
          },
          onAutoplayBlocked: () => setPlaying(false),
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
  }, [current]);

  useEffect(() => {
    if (!current || !player.current) return;
    player.current.loadVideoById(current.videoId);
    setProgress(0);
    setDuration(0);
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
        setQuery("");
        document.querySelector<HTMLInputElement>(".composer input")?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  async function search() {
    const text = query.trim();
    if (!text || searching) return;

    searchAbort.current?.abort();
    const controller = new AbortController();
    searchAbort.current = controller;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text,
    };

    setChat((messages) => [...messages, userMessage]);
    setQuery("");
    setSearching(true);

    try {
      const response = await fetch(`/api/music/search?q=${encodeURIComponent(text)}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error(`Search failed: ${response.status}`);

      const data: { items?: MusicResult[]; error?: string } = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];

      setResults(items);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: data.error || !items.length
          ? "No encontré esa canción. Prueba con el título y el artista."
          : "Encontré estas canciones. Reproduciendo la primera.",
      };

      setChat((messages) => [...messages, assistantMessage]);

      if (items.length) {
        setQueue(items);
        setCurrent(null);
        setPlaying(false);
        setProgress(0);
        setDuration(0);
      }
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

  function togglePlayback() {
    if (!player.current) return;

    if (playing) {
      player.current.pauseVideo();
      setPlaying(false);
    } else {
      player.current.playVideo();
      setPlaying(true);
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

  return (
    <main className="app">
      <Sidebar recent={chat.find((message) => message.role === "user")?.text ?? ""} onReset={reset} />

      <section className="main">
        <header className="topbar">
          <button className="mobileMenu" aria-label="Menú">
            <Icon path={ICONS.menu} />
          </button>
          <button className="modelPicker">Mfly <span>⌄</span></button>
          <button className="topAction" aria-label="Compartir">
            <Icon path={ICONS.share} />
          </button>
        </header>

        <section className={`chat ${chat.length ? "hasMessages" : ""}`}>
          {!chat.length ? (
            <div className="welcome">
              <div className="welcomeLogo">M</div>
              <h1>¿Qué quieres escuchar?</h1>
              <p>Entra al chat y pide cualquier canción, artista o estilo.</p>
            </div>
          ) : (
            <div className="conversation">
              {chat.map((message) => (
                <div className={`message ${message.role}`} key={message.id}>
                  {message.role === "assistant" && <div className="assistantAvatar">M</div>}
                  <div className="messageBody">
                    <div className="messageText">{message.text}</div>

                    {message.role === "assistant" && message.id === chat[chat.length - 1]?.id && results.length > 0 && (
                      <div className="resultGrid">
                        {results.map((item) => (
                          <ResultCard
                            key={item.videoId}
                            item={item}
                            playing={current?.videoId === item.videoId && playing}
                            onPlay={() => playResult(item)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {searching && (
                <div className="message assistant">
                  <div className="assistantAvatar">M</div>
                  <div className="thinking" aria-label="Buscando">
                    <i /><i /><i />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

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
            placeholder="¿Qué quieres escuchar?"
            aria-label="Buscar música"
          />
          <button type="submit" className="send" disabled={searching || !query.trim()} aria-label="Enviar">
            <Icon path={ICONS.send} />
          </button>
          <div className="composerHint">Mfly · búsqueda musical</div>
        </form>
      </section>

      <div id="mfly-youtube-player" className="youtubePlayer" aria-hidden="true" />

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
    </main>
  );
}
