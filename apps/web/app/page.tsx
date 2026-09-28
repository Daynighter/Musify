"use client";

import { useEffect, useRef, useState } from "react";

type Track = { id:number; title:string; artist:string; album:string; duration:string; src:string };
type MusicResult = { videoId:string; title:string; artist:string; album?:string; artwork?:string };

const demo:Track[]=[
  {id:1,title:"Neon Skies",artist:"Luma",album:"Afterglow",duration:"3:24",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"},
  {id:2,title:"Midnight Drive",artist:"Nova",album:"City Lights",duration:"4:02",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"},
  {id:3,title:"Ocean Echo",artist:"Mira",album:"Tides",duration:"3:41",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"},
];

export default function Home(){
  const audio=useRef<HTMLAudioElement>(null);
  const[q,setQ]=useState(""); const[searching,setSearching]=useState(false);
  const[results,setResults]=useState<MusicResult[]>([]); const[selected,setSelected]=useState<MusicResult|null>(null);
  const[current,setCurrent]=useState(demo[0]); const[playing,setPlaying]=useState(false);
  const[playlist,setPlaylist]=useState<Track[]>([]);
  const[chat,setChat]=useState<{role:"user"|"assistant";text:string}[]>([]);

  useEffect(()=>{const a=audio.current;if(!a)return;a.src=current.src;if(playing)a.play().catch(()=>setPlaying(false));},[current,playing]);
  useEffect(()=>{if(!("mediaSession"in navigator))return;navigator.mediaSession.metadata=new MediaMetadata({title:current.title,artist:current.artist,album:current.album});navigator.mediaSession.setActionHandler("play",()=>{audio.current?.play();setPlaying(true)});navigator.mediaSession.setActionHandler("pause",()=>{audio.current?.pause();setPlaying(false)})},[current]);

  async function search(){
    const text=q.trim(); if(!text)return; setChat(c=>[...c,{role:"user",text}]); setSearching(true);
    try{const r=await fetch("/api/music/search?q="+encodeURIComponent(text));const d=await r.json();setResults(d.items||[]);setChat(c=>[...c,{role:"assistant",text:d.error?"El proveedor no respondió correctamente.":"He encontrado resultados en YouTube Music mediante el proveedor InnerTube."}])}
    catch{setChat(c=>[...c,{role:"assistant",text:"No se pudo completar la búsqueda."}])} finally{setSearching(false)}
  }
  const toggle=()=>{const a=audio.current;if(!a)return;if(a.paused){a.play();setPlaying(true)}else{a.pause();setPlaying(false)}};

  return <main className="app">
    <aside><div className="brand"><span className="logo">M</span><span>Mfly</span></div>
      <button className="newChat" onClick={()=>{setChat([]);setQ("");setResults([]);setSelected(null)}}>＋ Nueva búsqueda</button>
      <nav><button>⌂ Inicio</button><button>⌕ Explorar</button><button>♡ Biblioteca</button></nav>
      <section className="side"><b>Playlists</b>{playlist.length?playlist.map(t=><span key={t.id}>{t.title}</span>):<small>Aún no tienes canciones guardadas.</small>}</section>
      <div className="sideNote">Mfly · PWA musical</div>
    </aside>

    <section className="content"><header><div className="mobileBrand">Mfly</div><div className="status">● Conectado</div></header>
      <section className="chat"><div className="welcome"><div className="welcomeIcon">♪</div><h1>¿Qué quieres escuchar?</h1><p>Busca canciones, artistas, álbumes o playlists.</p>
        <div className="suggestions"><button onClick={()=>setQ("música para estudiar")}>🎧 Música para estudiar</button><button onClick={()=>setQ("pop español")}>✨ Pop español</button><button onClick={()=>setQ("lo-fi")}>🌙 Lo-fi</button></div>
      </div>
      {chat.map((m,i)=><div className={"bubble "+m.role} key={i}><b>{m.role==="user"?"Tú":"Mfly"}</b><span>{m.text}</span></div>)}
      {searching&&<div className="bubble assistant"><b>Mfly</b><span>Buscando en el catálogo…</span></div>}
      {results.length>0&&<div className="results">{results.map(x=><article className="yt" key={x.videoId} onClick={()=>setSelected(x)}>
        {x.artwork?<img src={x.artwork} alt=""/>:<div className="cover">♪</div>}<div><b>{x.title}</b><span>{x.artist}{x.album?" · "+x.album:""}</span></div><button className="resultPlay" onClick={(e)=>{e.stopPropagation();setSelected(x)}}>▶</button>
      </article>)}</div>}
      <div className="demo"><div className="sectionTitle"><h2>También puedes probar</h2></div>{demo.map(t=><article className="track" key={t.id}><div className="cover">{t.title[0]}</div><div className="meta"><b>{t.title}</b><span>{t.artist} · {t.album}</span></div><button onClick={()=>setPlaylist(p=>p.some(x=>x.id===t.id)?p.filter(x=>x.id!==t.id):[...p,t])}>{playlist.some(x=>x.id===t.id)?"✓":"+"}</button><button className="play" onClick={()=>{setCurrent(t);setPlaying(true)}}>▶</button></article>)}</div>
      </section>
      <form className="composer" onSubmit={e=>{e.preventDefault();search()}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Pregunta a Mfly qué quieres escuchar…"/><button type="submit" disabled={searching}>↑</button><small>Proveedor: InnerTube · reproducción de resultados mediante YouTube.</small></form>
    </section>
    <audio ref={audio} onEnded={()=>setPlaying(false)} preload="metadata"/>
    {selected&&<div className="playerModal" onClick={()=>setSelected(null)}><div className="playerCard" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>×</button><img src={selected.artwork} alt=""/><h2>{selected.title}</h2><p>{selected.artist}</p><div className="embed"><iframe title={selected.title} src={"https://www.youtube.com/embed/"+selected.videoId+"?autoplay=1&rel=0"} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/></div><a className="openExternal" href={"https://music.youtube.com/watch?v="+selected.videoId} target="_blank" rel="noreferrer">Abrir en YouTube Music ↗</a></div></div>}
    <footer><div className="now"><div className="mini">{current.title[0]}</div><div><b>{current.title}</b><span>{current.artist}</span></div></div><div className="player"><div className="controls"><button>⏮</button><button className="mainPlay" onClick={toggle}>{playing?"Ⅱ":"▶"}</button><button>⏭</button></div><div className="bar"><i style={{width:playing?"42%":"0%"}}/></div></div><span>{current.duration}</span></footer>
  </main>
}