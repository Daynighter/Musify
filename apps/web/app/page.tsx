"use client";

import { useEffect, useRef, useState } from "react";

type MusicResult = {
  videoId: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
};

const icon = (path: string) => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg>
);

export default function Home() {
  const player = useRef<any>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<MusicResult[]>([]);
  const [queue, setQueue] = useState<MusicResult[]>([]);
  const [current, setCurrent] = useState<MusicResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [chat, setChat] = useState<{ role: "user" | "assistant"; text: string }[]>([]);

  useEffect(() => {
    const w = window as any;
    const init = () => {
      if (!w.YT?.Player || player.current) return;
      player.current = new w.YT.Player("mfly-youtube-player", {
        width: "1",
        height: "1",
        videoId: current?.videoId,
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
          onStateChange: (event: any) => {
            setPlaying(event.data === w.YT.PlayerState.PLAYING);
            if (event.target.getDuration) setDuration(event.target.getDuration() || 0);
          },
          onError: () => setPlaying(false),
        },
      });
    };

    if (w.YT?.Player) init();
    else {
      const previous = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        previous?.();
        init();
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }
  }, [current]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!player.current?.getCurrentTime || !player.current?.getDuration) return;
      const d = player.current.getDuration();
      if (d) {
        setDuration(d);
        setProgress(player.current.getCurrentTime() / d);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!current || !player.current?.loadVideoById) return;
    player.current.loadVideoById(current.videoId);
    setProgress(0);
    setDuration(0);
  }, [current]);

  function playResult(item: MusicResult, source = results) {
    setQueue(source);
    setCurrent(item);
    setPlaying(true);
  }

  function playIndex(index: number) {
    if (!queue.length) return;
    playResult(queue[(index + queue.length) % queue.length], queue);
  }

  function next() {
    if (!current) return;
    const index = queue.findIndex((item) => item.videoId === current.videoId);
    playIndex(index + 1);
  }

  function previous() {
    if (!current) return;
    const index = queue.findIndex((item) => item.videoId === current.videoId);
    playIndex(index - 1);
  }

  function toggle() {
    if (!player.current) return;
    if (playing) player.current.pauseVideo();
    else player.current.playVideo();
  }

  async function search() {
    const text = query.trim();
    if (!text || searching) return;

    setChat((items) => [...items, { role: "user", text }]);
    setQuery("");
    setSearching(true);

    try {
      const response = await fetch("/api/music/search?q=" + encodeURIComponent(text));
      const data = await response.json();
      const items: MusicResult[] = data.items || [];
      setResults(items);

      if (data.error || !items.length) {
        setChat((messages) => [...messages, { role: "assistant", text: "No encontré esa canción. Prueba con el título y el artista." }]);
      } else {
        setChat((messages) => [...messages, { role: "assistant", text: "Encontré estas canciones. Reproduciendo la primera." }]);
        playResult(items[0], items);
      }
    } catch {
      setChat((messages) => [...messages, { role: "assistant", text: "No se pudo completar la búsqueda." }]);
    } finally {
      setSearching(false);
    }
  }

  function reset() {
    player.current?.stopVideo?.();
    setChat([]);
    setQuery("");
    setResults([]);
    setQueue([]);
    setCurrent(null);
    setPlaying(false);
    setProgress(0);
  }

  const formatted = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="sidebarTop">
          <button className="brandButton" aria-label="Mfly">M</button>
          <button className="newChat" onClick={reset}>
            {icon("M12 5v14M5 12h14")}<span>Nuevo chat</span><kbd>⌘ K</kbd>
          </button>
        </div>
        <div className="sideSection">
          <span className="sideLabel">Recientes</span>
          <button className="historyItem active">{icon("M8 5v14l11-7z")}<span>{chat[0]?.text || "Explorar música"}</span></button>
        </div>
        <div className="sidebarBottom">
          <button className="sideLink">{icon("M12 3v2M12 19v2M3 12h2M19 12h2")}<span>Ajustes</span></button>
          <button className="profile"><span className="avatar">M</span><span>Mfly</span><span>•••</span></button>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <button className="mobileMenu" aria-label="Menú">{icon("M4 6h16M4 12h16M4 18h16")}</button>
          <button className="modelPicker">Mfly <span>⌄</span></button>
          <button className="topAction" aria-label="Compartir">{icon("M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14")}</button>
        </header>

        <section className={"chat " + (chat.length ? "hasMessages" : "")}>
          {!chat.length ? (
            <div className="welcome">
              <div className="welcomeLogo">M</div>
              <h1>¿Qué quieres escuchar?</h1>
              <p>Entra al chat y pide cualquier canción, artista o estilo.</p>
            </div>
          ) : (
            <div className="conversation">
              {chat.map((message, index) => (
                <div className={"message " + message.role} key={index}>
                  {message.role === "assistant" && <div className="assistantAvatar">M</div>}
                  <div className="messageBody">
                    <div className="messageText">{message.text}</div>
                    {message.role === "assistant" && index === chat.length - 1 && results.length > 0 && (
                      <div className="resultGrid">
                        {results.map((item) => (
                          <article className={"musicCard " + (current?.videoId === item.videoId ? "isPlaying" : "")} key={item.videoId} onClick={() => playResult(item)}>
                            <div className="artwork">
                              <img src={item.artwork || `https://i.ytimg.com/vi/${item.videoId}/maxresdefault.jpg`} alt="" loading="lazy" />
                              <button aria-label="Reproducir" onClick={(event) => { event.stopPropagation(); playResult(item); }}>
                                {icon(current?.videoId === item.videoId && playing ? "M8 6h3v12H8zM13 6h3v12h-3z" : "M8 5v14l11-7z")}
                              </button>
                            </div>
                            <div className="cardMeta"><b>{item.title}</b><span>{item.artist}</span>{item.album && <small>{item.album}</small>}</div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {searching && <div className="message assistant"><div className="assistantAvatar">M</div><div className="thinking"><i/><i/><i/></div></div>}
            </div>
          )}
        </section>

        <form className="composer" onSubmit={(event) => { event.preventDefault(); search(); }}>
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="¿Qué quieres escuchar?" aria-label="Buscar música" />
          <button type="submit" className="send" disabled={searching || !query.trim()} aria-label="Enviar">
            {icon("M5 12l5 5L20 7")}
          </button>
          <div className="composerHint">Mfly · búsqueda musical</div>
        </form>
      </section>

      <div id="mfly-youtube-player" className="youtubePlayer" aria-hidden="true" />

      <footer className={"playerBar " + (current ? "hasTrack" : "")}>
        {current ? (
          <>
            <div className="now">
              <div className="mini">
                {current.artwork ? <img src={current.artwork} alt="" /> : current.title[0]}
              </div>
              <div className="nowText"><b>{current.title}</b><span>{current.artist}</span></div>
            </div>
            <div className="player">
              <div className="controls">
                <button aria-label="Anterior" onClick={previous}>{icon("M6 6v12M18 6l-8 6 8 6z")}</button>
                <button className="mainPlay" aria-label={playing ? "Pausar" : "Reproducir"} onClick={toggle}>
                  {icon(playing ? "M8 6h3v12H8zM13 6h3v12h-3z" : "M8 5v14l11-7z")}
                </button>
                <button aria-label="Siguiente" onClick={next}>{icon("M18 6v12M6 6l8 6-8 6z")}</button>
              </div>
              <div className="progressRow">
                <span>{formatted(progress * duration)}</span>
                <button className="progressTrack" aria-label="Progreso" onClick={(event) => {
                  if (!duration || !player.current) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
                  player.current.seekTo(duration * ratio, true);
                }}><i style={{ width: `${progress * 100}%` }} /></button>
                <span>{formatted(duration)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="playerEmpty">Mfly está listo para reproducir.</div>
        )}
      </footer>
    </main>
  );
}
