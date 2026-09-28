"use client";

import { useEffect, useRef, useState } from "react";

type Track={id:number;title:string;artist:string;album:string;duration:string;src:string};
type MusicResult={videoId:string;title:string;artist:string;album?:string;artwork?:string};

const demo:Track[]=[
{id:1,title:"Neon Skies",artist:"Luma",album:"Afterglow",duration:"3:24",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"},
{id:2,title:"Midnight Drive",artist:"Nova",album:"City Lights",duration:"4:02",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"},
{id:3,title:"Ocean Echo",artist:"Mira",album:"Tides",duration:"3:41",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"}];

export default function Home(){
const audio=useRef<HTMLAudioElement>(null);
const[q,setQ]=useState("");const[searching,setSearching]=useState(false);const[results,setResults]=useState<MusicResult[]>([]);
const[selected,setSelected]=useState<MusicResult|null>(null);const[current,setCurrent]=useState(demo[0]);const[playing,setPlaying]=useState(false);const[playlist,setPlaylist]=useState<Track[]>([]);const[chat,setChat]=useState<{role:"user"|"assistant";text:string}[]>([]);

useEffect(()=>{const a=audio.current;if(!a)return;a.src=current.src;if(playing)a.play().catch(()=>setPlaying(false))},[current,playing]);
useEffect(()=>{if(!("mediaSession"in navigator))return;navigator.mediaSession.metadata=new MediaMetadata({title:current.title,artist:current.artist,album:current.album});navigator.mediaSession.setActionHandler("play",()=>{audio.current?.play();setPlaying(true)});navigator.mediaSession.setActionHandler("pause",()=>{audio.current?.pause();setPlaying(false)})},[current]);
async function search(){const text=q.trim();if(!text)return;setChat(c=>[...c,{role:"user",text}]);setSearching(true);try{const r=await fetch("/api/music/search?q="+encodeURIComponent(text));const d=await r.json();setResults(d.items||[]);setChat(c=>[...c,{role:"assistant",text:d.error?"No disponible":"Resultados listos"}])}catch{setChat(c=>[...c,{role:"assistant",text:"Error"}])}finally{setSearching(false)}}
const toggle=()=>{const a=audio.current;if(!a)return;if(a.paused){a.play();setPlaying(true)}else{a.pause();setPlaying(false)}};

return <main className="app">
<aside>
<button className="iconButton brand" aria-label="Mfly">M</button>
<button className="iconButton active" aria-label="Inicio">⌂</button>
<button className="iconButton" aria-label="Buscar" onClick={()=>document.getElementById("search")?.focus()}>⌕</button>
<button className="iconButton" aria-label="Biblioteca">♡</button>
<div className="asideBottom"><button className="iconButton" aria-label="Nueva búsqueda" onClick={()=>{setChat([]);setQ("");setResults([]);setSelected(null)}}>＋</button></div>
</aside>

<section className="content">
<header><div className="brandMark">M</div><button className="headerIcon" aria-label="Perfil">●</button></header>
<section className="chat">
<div className="welcome"><div className="welcomeIcon">♪</div><h1>Mfly</h1><p>Tu música.</p>
<div className="suggestions"><button onClick={()=>setQ("música para estudiar")}>◌</button><button onClick={()=>setQ("pop español")}>✦</button><button onClick={()=>setQ("lo-fi")}>◒</button></div></div>
{chat.map((m,i)=><div className={"bubble "+m.role} key={i}><span>{m.text}</span></div>)}
{searching&&<div className="bubble assistant"><span>•••</span></div>}
{results.length>0&&<div className="results">{results.map(x=><article className="yt" key={x.videoId} onClick={()=>setSelected(x)}>{x.artwork?<img src={x.artwork} alt=""/>:<div className="cover">♪</div>}<div><b>{x.title}</b><span>{x.artist}{x.album?" · "+x.album:""}</span></div><button className="resultPlay" aria-label="Reproducir" onClick={e=>{e.stopPropagation();setSelected(x)}}>▶</button></article>)}</div>}
<div className="demo">{demo.map(t=><article className="track" key={t.id}><div className="cover">{t.title[0]}</div><div className="meta"><b>{t.title}</b><span>{t.artist} · {t.album}</span></div><button aria-label="Playlist" onClick={()=>setPlaylist(p=>p.some(x=>x.id===t.id)?p.filter(x=>x.id!==t.id):[...p,t])}>{playlist.some(x=>x.id===t.id)?"✓":"+"}</button><button className="play" aria-label="Reproducir" onClick={()=>{setCurrent(t);setPlaying(true)}}>▶</button></article>)}</div>
</section>
<form id="search" className="composer" onSubmit={e=>{e.preventDefault();search()}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="⌕" aria-label="Buscar música"/><button type="submit" disabled={searching} aria-label="Buscar">↑</button></form>
</section>
<audio ref={audio} onEnded={()=>setPlaying(false)} preload="metadata"/>
{selected&&<div className="playerModal" onClick={()=>setSelected(null)}><div className="playerCard" onClick={e=>e.stopPropagation()}><button className="close" aria-label="Cerrar" onClick={()=>setSelected(null)}>×</button>{selected.artwork&&<img src={selected.artwork} alt=""/>}<h2>{selected.title}</h2><p>{selected.artist}</p><div className="embed"><iframe title={selected.title} src={"https://www.youtube.com/embed/"+selected.videoId+"?autoplay=1&rel=0"} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/></div><a className="openExternal" href={"https://music.youtube.com/watch?v="+selected.videoId} target="_blank" rel="noreferrer">↗</a></div></div>}
<footer><div className="now"><div className="mini">{current.title[0]}</div><div><b>{current.title}</b><span>{current.artist}</span></div></div><div className="player"><div className="controls"><button aria-label="Anterior">⏮</button><button className="mainPlay" aria-label="Reproducir" onClick={toggle}>{playing?"Ⅱ":"▶"}</button><button aria-label="Siguiente">⏭</button></div><div className="bar"><i style={{width:playing?"42%":"0%"}}/></div></div><span>{current.duration}</span></footer>
</main>}