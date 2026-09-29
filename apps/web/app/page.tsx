"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

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
  results?: MusicResult[];
};

const icons = {
  plus: "M12 5v14M5 12h14",
  play: "M8 5v14l11-7z",
  music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  search: "m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  gamepad: "M6 11h4m-2-2v4m8-2h.01M19 8h.01M7.8 18h8.4a3 3 0 0 0 2.85-2.06l1.35-4.05A4 4 0 0 0 16.6 6H7.4a4 4 0 0 0-3.8 5.89l1.35 4.05A3 3 0 0 0 7.8 18Z",
  code: "m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14",
  sparkles: "m12 3-1.2 4.1L7 8.3l3.8 1.2L12 14l1.2-4.5L17 8.3l-3.8-1.2L12 3Zm7 10-.7 2.3L16 16l2.3.7L19 19l.7-2.3L22 16l-2.3-.7L19 13Z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  x: "M6 6l12 12M18 6 6 18",
};

function Icon({ path }: { path: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg>;
}

function ResultCard({ video, onPlay }: { video: MusicResult; onPlay: () => void }) {
  const image = video.artwork || "https://i.ytimg.com/vi/" + encodeURIComponent(video.videoId) + "/hqdefault.jpg";

  return (
    <article className="videoCard">
      <button className="thumbnailButton" type="button" onClick={onPlay} aria-label={"Reproducir " + video.title}>
        <img src={image} alt="" loading="lazy" />
        <span className="playButton"><Icon path={icons.play} /></span>
      </button>
      <div className="videoMeta">
        <div className="videoTitle">{video.title}</div>
        <div className="videoChannel">{video.artist}</div>
        {video.album && <div className="videoChannel">{video.album}</div>}
      </div>
    </article>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState<MusicResult | null>(null);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function autoResize() {
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
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: clean }]);
    setLoading(true);

    try {
      const response = await fetch("/api/music/search?q=" + encodeURIComponent(clean), {
        headers: { Accept: "application/json" },
      });
      const data: { items?: MusicResult[]; error?: string } = await response.json();

      if (!response.ok || data.error) throw new Error(data.error || "El servidor respondió con " + response.status + ".");

      const items = Array.isArray(data.items) ? data.items : [];
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: items.length ? "Resultados para “" + clean + "”" : "No se encontraron canciones para esta búsqueda.",
          results: items,
        },
      ]);

      if (!items.length) setError("No se encontraron canciones para esta búsqueda.");
    } catch (e) {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text: e instanceof Error ? e.message : "No se pudo completar la búsqueda." }]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void searchMusic();
  }

  function resetChat() {
    setMessages([]);
    setPlayer(null);
    setQuery("");
    setError("");
    setLoading(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbarSide">
          <button className="iconButton" type="button" onClick={resetChat} aria-label="Nuevo chat" title="Nuevo chat">
            <Icon path={icons.plus} />
          </button>
        </div>
        <div className="brand"><span>Musify</span></div>
        <div className="topbarSide right">
          <button className="iconButton" type="button" onClick={resetChat} aria-label="Limpiar chat" title="Limpiar chat">
            <span className="moreDots">•••</span>
          </button>
        </div>
      </header>

      <main>
        <section className="chat">
          {!messages.length ? (
            <div className="emptyState">
              <div className="emptyIcon"><Icon path={icons.music} /></div>
              <h1>¿Qué quieres escuchar?</h1>
              <p>Busca canciones, artistas, álbumes o estilos y explora sus carátulas directamente dentro de esta conversación.</p>
              <div className="quickActions">
                <button className="quickAction" type="button" onClick={() => void searchMusic("Música electrónica")}><Icon path={icons.music} /><span>Música electrónica</span></button>
                <button className="quickAction" type="button" onClick={() => void searchMusic("Pop actual")}><Icon path={icons.sparkles} /><span>Pop actual</span></button>
                <button className="quickAction" type="button" onClick={() => void searchMusic("Música para estudiar")}><Icon path={icons.code} /><span>Para estudiar</span></button>
                <button className="quickAction" type="button" onClick={() => void searchMusic("Bandas sonoras")}><Icon path={icons.gamepad} /><span>Bandas sonoras</span></button>
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((message) => (
                <div className={"message " + message.role} key={message.id}>
                  {message.role === "user" ? (
                    <div className="userBubble">{message.text}</div>
                  ) : (
                    <div className="assistant">
                      <div className="assistantLabel">
                        <div className="assistantLabelMark"><Icon path={icons.music} /></div>
                        <span>Musify</span>
                      </div>
                      <div className="assistantText">{message.text}</div>
                      {message.results && message.results.length > 0 && (
                        <div className="resultsGrid">
                          {message.results.map((video) => (
                            <ResultCard key={video.videoId} video={video} onPlay={() => setPlayer(video)} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="message assistant">
                  <div className="assistantLabel">
                    <div className="assistantLabelMark"><Icon path={icons.music} /></div>
                    <span>Buscando en Musify</span>
                  </div>
                  <div className="loading"><i /><i /><i /></div>
                </div>
              )}
              {error && <div className="error">{error}</div>}
            </div>
          )}
        </section>
      </main>

      {player && (
        <div className="playerMessage">
          <div className="playerCard">
            <div className="playerHeader">
              <div className="playerTitle">{player.title} · {player.artist}</div>
              <button className="playerClose" type="button" onClick={() => setPlayer(null)} aria-label="Cerrar reproductor"><Icon path={icons.x} /></button>
            </div>
            <div className="playerFrame">
              <iframe
                src={"https://www.youtube.com/embed/" + encodeURIComponent(player.videoId) + "?autoplay=1&rel=0"}
                title={player.title}
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      <div className="composerArea">
        <div className="composerWrap">
          <form className="composer" onSubmit={submit}>
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); autoResize(); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void searchMusic();
                }
              }}
              rows={1}
              autoComplete="off"
              placeholder="Busca una canción o artista..."
              aria-label="Buscar música"
            />
            <button className="sendButton" type="submit" disabled={loading || !query.trim()} aria-label="Buscar">
              <Icon path={icons.arrow} />
            </button>
          </form>
          <div className="composerHint">Musify · búsqueda musical</div>
        </div>
      </div>
    </div>
  );
}
