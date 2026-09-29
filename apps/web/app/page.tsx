"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Code2,
  Gamepad2,
  Loader2,
  MoreHorizontal,
  Music2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Sparkles,
  X,
} from "lucide-react";

type MusicResult = {
  id: string;
  videoId?: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  previewUrl?: string;
  source: "itunes" | "youtube";
};

type YouTubePlayer = {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  destroy?: () => void;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  results?: MusicResult[];
};

const quickSearches = [
  { label: "Música electrónica", query: "Música electrónica", icon: Music2 },
  { label: "Pop actual", query: "Pop actual", icon: Sparkles },
  { label: "Para estudiar", query: "Música para estudiar", icon: Code2 },
  { label: "Bandas sonoras", query: "Bandas sonoras", icon: Gamepad2 },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState<MusicResult | null>(null);
  const [queue, setQueue] = useState<MusicResult[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);
  const youtubeReadyRef = useRef(false);
  const youtubeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();

    const w = window as Window & {
      YT?: { Player: new (element: HTMLElement, options: any) => YouTubePlayer };
      onYouTubeIframeAPIReady?: () => void;
    };

    const createPlayer = () => {
      if (!youtubeContainerRef.current || !w.YT?.Player) return;
      youtubePlayerRef.current?.destroy?.();
      youtubePlayerRef.current = new w.YT.Player(youtubeContainerRef.current, {
        width: "200",
        height: "200",
        playerVars: { playsinline: 1, controls: 1, rel: 0 },
        events: {
          onReady: () => {
            youtubeReadyRef.current = true;
            if (player?.videoId) {
              youtubePlayerRef.current?.loadVideoById(player.videoId);
            }
          },
          onStateChange: (event: { data: number }) => {
            if (event.data === 1) setIsPlaying(true);
            if (event.data === 2) setIsPlaying(false);
            if (event.data === 0) playNext();
          },
        },
      });
    };

    if (!document.querySelector('script[data-youtube-iframe-api]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.dataset.youtubeIframeApi = "true";
      w.onYouTubeIframeAPIReady = createPlayer;
      document.head.appendChild(script);
    } else if (w.YT?.Player) {
      createPlayer();
    } else {
      w.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      youtubePlayerRef.current?.destroy?.();
      youtubePlayerRef.current = null;
      youtubeReadyRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!player?.videoId || !youtubeReadyRef.current) return;
    youtubePlayerRef.current?.loadVideoById(player.videoId);
    setIsPlaying(true);
  }, [player?.videoId]);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 130) + "px";
  }

  async function searchMusic(value = query) {
    const clean = value.trim();
    if (!clean || loading) return;

    setQuery("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setError("");
    setMessages((items) => [
      ...items,
      { id: crypto.randomUUID(), role: "user", text: clean },
    ]);
    setLoading(true);

    try {
      const response = await fetch(
        "/api/music/search?q=" + encodeURIComponent(clean),
        { headers: { Accept: "application/json" } }
      );
      const data: { items?: MusicResult[]; error?: string } =
        await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error || "No se pudo completar la búsqueda."
        );
      }

      const items = Array.isArray(data.items) ? data.items : [];

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: items.length
            ? `Resultados para “${clean}”`
            : "No se encontraron canciones para esta búsqueda.",
          results: items,
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo completar la búsqueda.";

      setError(message);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", text: message },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void searchMusic();
  }

  function playTrack(track: MusicResult, list?: MusicResult[], index?: number) {
    const nextQueue = list ?? queue;
    const nextIndex = index ?? nextQueue.findIndex((item) => item.id === track.id);
    setQueue(nextQueue);
    setQueueIndex(nextIndex);
    setPlayer(track);
    setIsPlaying(true);
  }

  function playPrevious() {
    if (!queue.length || queueIndex <= 0) return;
    playTrack(queue[queueIndex - 1], queue, queueIndex - 1);
  }

  function playNext() {
    if (!queue.length || queueIndex >= queue.length - 1) return;
    playTrack(queue[queueIndex + 1], queue, queueIndex + 1);
  }

  function reset() {
    setMessages([]);
    setPlayer(null);
    setQueue([]);
    setQueueIndex(-1);
    setQuery("");
    setError("");
    setLoading(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-side">
          <button
            className="icon-button"
            type="button"
            onClick={reset}
            aria-label="Nuevo chat"
            title="Nuevo chat"
          >
            <span className="plus-icon">+</span>
          </button>
        </div>

        <div className="brand">Musify</div>

        <div className="topbar-side right">
          <button
            className="icon-button"
            type="button"
            onClick={reset}
            aria-label="Limpiar"
            title="Limpiar"
          >
            <MoreHorizontal size={19} />
          </button>
        </div>
      </header>

      <section className="chat">
        {!messages.length ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Music2 size={23} />
            </div>

            <h1>¿Qué quieres escuchar?</h1>

            <p>
              Busca canciones, artistas, álbumes o estilos y explora sus
              carátulas directamente dentro de esta conversación.
            </p>

            <div className="quick-actions">
              {quickSearches.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.query}
                    className="quick-action"
                    type="button"
                    onClick={() => void searchMusic(item.query)}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="conversation">
            {messages.map((message) => (
              <div className={"message " + message.role} key={message.id}>
                {message.role === "user" ? (
                  <div className="user-bubble">{message.text}</div>
                ) : (
                  <div className="assistant-message">
                    <div className="assistant-label">
                      <span className="assistant-dot">M</span>
                      <span>Musify</span>
                    </div>

                    <div className="assistant-text">{message.text}</div>

                    {message.results && message.results.length > 0 && (
                      <div className="music-grid">
                        {message.results.map((track) => {
                          const image =
                            track.artwork ||
                            (track.videoId
                              ? `https://i.ytimg.com/vi/${encodeURIComponent(
                                  track.videoId
                                )}/hqdefault.jpg`
                              : "");

                          return (
                            <article className="music-card" key={track.id}>
                              <button
                                className="cover"
                                type="button"
                                onClick={() => playTrack(track, message.results, message.results.indexOf(track))
                                aria-label={"Reproducir " + track.title}
                              >
                                {image ? (
                                  <img
                                    src={image}
                                    alt=""
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="cover-fallback">
                                    <Music2 size={32} />
                                  </span>
                                )}

                                <span className="play-button">
                                  <Play size={18} fill="currentColor" />
                                </span>
                              </button>

                              <div className="track-info">
                                <div className="track-title">{track.title}</div>
                                <div className="track-artist">{track.artist}</div>
                                {track.album && (
                                  <div className="track-album">{track.album}</div>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="message assistant">
                <div className="assistant-message">
                  <div className="assistant-label">
                    <span className="assistant-dot">M</span>
                    <span>Buscando música...</span>
                  </div>
                  <div className="loading">
                    <Loader2 size={17} className="spin" />
                    <span>Buscando resultados</span>
                  </div>
                </div>
              </div>
            )}

            {error && <div className="error">{error}</div>}
          </div>
        )}
      </section>

      {player && (
        <div className="mini-player" role="region" aria-label="Reproductor">
          <div className="mini-player-art">
            {player.artwork ? <img src={player.artwork} alt="" /> : <Music2 size={20} />}
          </div>
          <div className="mini-player-info">
            <div className="mini-player-title">{player.title}</div>
            <div className="mini-player-artist">{player.artist}</div>
          </div>
          <div className="mini-player-actions">
            <button type="button" aria-label="Anterior" title="Anterior" onClick={playPrevious} disabled={queueIndex <= 0}><SkipBack size={18} fill="currentColor" /></button>
            <button type="button" className="mini-play" aria-label={isPlaying ? "Pausar" : "Reproducir"} title={isPlaying ? "Pausar" : "Reproducir"}>
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
            <button type="button" aria-label="Siguiente" title="Siguiente" onClick={playNext} disabled={queueIndex < 0 || queueIndex >= queue.length - 1}><SkipForward size={18} fill="currentColor" /></button>
            <button type="button" className="mini-close" onClick={() => setPlayer(null)} aria-label="Cerrar reproductor" title="Cerrar"><X size={16} /></button>
          </div>
          <div className="mini-player-media">
            <div ref={youtubeContainerRef} className={player.source === "youtube" ? "youtube-player-host" : "youtube-player-host hidden"} />
            {player.source === "itunes" && player.previewUrl ? (
              <audio src={player.previewUrl} controls autoPlay playsInline onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={playNext} />
            ) : player.videoId ? (
              <iframe src={"https://www.youtube.com/embed/" + encodeURIComponent(player.videoId) + "?autoplay=1&controls=1&rel=0&playsinline=1"} title={player.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            ) : null}
          </div>
        </div>
      )}

      <div className="composer-area">
        <div className="composer-wrapper">
          <form className="composer" onSubmit={submit}>
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                resizeTextarea();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void searchMusic();
                }
              }}
              rows={1}
              autoComplete="off"
              placeholder="Busca una canción o artista..."
              aria-label="Buscar música"
            />

            <button
              className="send-button"
              type="submit"
              disabled={loading || !query.trim()}
              aria-label="Buscar"
            >
              <ArrowUp size={18} />
            </button>
          </form>

          <div className="composer-hint">Musify · búsqueda musical</div>
        </div>
      </div>
    </main>
  );
}
