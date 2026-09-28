"use client";

import { useEffect, useRef, useState } from "react";

type Track={id:number;title:string;artist:string;album:string;duration:string;src:string};
type MusicResult={videoId:string;title:string;artist:string;album?:string;artwork?:string};
const icon=(path:string)=><svg viewBox="0 0 24 24" aria-hidden="true"><path d={path}/></svg>;

const demo:Track[]=[
{id:1,title:"Neon Skies",artist:"Luma",album:"Afterglow",duration:"3:24",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"},
{id:2,title:"Midnight Drive",artist:"Nova",album:"City Lights",duration:"4:02",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"},
{id:3,title:"Ocean Echo",artist:"Mira",album:"Tides",duration:"3:41",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"}];

export default function Home(){
const audio=useRef<HTMLAudioElement>(null);
const[q,setQ]=useState("");const[searching,setSearching]=useState(false);const[results,setResults]=useState<MusicResult[]>([]);
const[selected,setSelected]=useState<MusicResult|null>(null);const[current,setCurrent]=useState<Track|null>(null);const[queue,setQueue]=useState<MusicResult[]>([]);const[playing,setPlaying]=useState(false);const[progress,setProgress]=useState(0);
const[chat,setChat]=useState<{role:"user"|"assistant";text:string}[]>([]);

useEffect(()=>{const a=audio.current;if(!a||!current)return;a.src=current.src;if(playing)a.play().catch(()=>setPlaying(false))},[current,playing]);
useEffect(()=>{const a=audio.current;if(!a)return;const onTime=()=>setProgress(a.duration? a.currentTime/a.duration:0);a.addEventListener("timeupdate",onTime);return()=>a.removeEventListener("timeupdate",onTime)},[]);
useEffect(()=>{if(!current||!("mediaSession"in navigator))return;navigator.mediaSession.metadata=new MediaMetadata({title:current.title,artist:current.artist,album:current.album});navigator.mediaSession.setActionHandler("play",()=>{audio.current?.play();setPlaying(true)});navigator.mediaSession.setActionHandler("pause",()=>{audio.current?.pause();setPlaying(false)})},[current]);
function playResult(x:MusicResult){setSelected(null);setQueue(results);setCurrent({id:0,title:x.title,artist:x.artist,album:x.album||"YouTube Music",duration:"",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"});setPlaying(true);}
function next(){const i=current?queue.findIndex(x=>x.title===current.title):0;const x=queue[(i+1)%Math.max(queue.length,1)];if(x)playResult(x)}

async function search(){
const text=q.trim();if(!text)return;
setChat(c=>[...c,{role:"user",text}]);setQ("");setSearching(true);
try{const r=await fetch("/api/music/search?q="+encodeURIComponent(text));const d=await r.json();setResults(d.items||[]);setChat(c=>[...c,{role:"assistant",text:d.error?"No pude encontrar resultados.":"Aquí tienes algunos resultados."}])}
catch{setChat(c=>[...c,{role:"assistant",text:"No se pudo completar la búsqueda."}])}
finally{setSearching(false)}
}
const reset=()=>{setChat([]);setQ("");setResults([]);setSelected(null)};
const toggle=()=>{const a=audio.current;if(!a)return;if(a.paused){a.play();setPlaying(true)}else{a.pause();setPlaying(false)}};

return <main className="app">
<aside className="sidebar">
<div className="sidebarTop">
<button className="brandButton" aria-label="Mfly">M</button>
<button className="newChat" onClick={reset}><span>＋</span><span>Nuevo chat</span><kbd>⌘ K</kbd></button>
</div>
<div className="sideSection"><span className="sideLabel">Recientes</span>
<button className="historyItem active">♪ <span>{chat[0]?.text||"Explorar música"}</span></button>
<button className="historyItem">♪ <span>Descubrir nuevos artistas</span></button>
</div>
<div className="sidebarBottom"><button className="sideLink">⚙ <span>Ajustes</span></button><button className="profile"><span className="avatar">M</span><span>Mfly</span><span>•••</span></button></div>
</aside>

<section className="main">
<header className="topbar"><button className="mobileMenu" aria-label="Menú">☰</button><button className="modelPicker">Mfly <span>⌄</span></button><button className="topAction" aria-label="Compartir">↗</button></header>

<section className={"chat "+(chat.length?"hasMessages":"")}>
{chat.length===0?<div className="welcome">
<div className="welcomeLogo">M</div><h1>¿Qué quieres escuchar?</h1><p>Busca música como si estuvieras hablando conmigo.</p>
<div className="promptGrid"><button onClick={()=>setQ("música para estudiar")}><span>◌</span><b>Música para estudiar</b><small>Ambiente y concentración</small></button><button onClick={()=>setQ("pop español")}><span>✦</span><b>Pop español</b><small>Lo más sonado</small></button><button onClick={()=>setQ("lo-fi")}><span>◒</span><b>Lo-fi</b><small>Relajarte y concentrarte</small></button><button onClick={()=>setQ("artistas parecidos a The Weeknd")}><span>⌁</span><b>Descubrir artistas</b><small>Encuentra algo nuevo</small></button></div>
</div>:<div className="conversation">
{chat.map((m,i)=><div className={"message "+m.role} key={i}>
{m.role==="assistant"&&<div className="assistantAvatar">M</div>}
<div className="messageBody"><div className="messageText">{m.text}</div>
{m.role==="assistant"&&i===chat.length-1&&results.length>0&&<div className="resultGrid">{results.map(x=><article className="musicCard" key={x.videoId} onClick={()=>playResult(x)}>
<div className="artwork">{x.artwork?<img src={x.artwork} alt="" loading="lazy" onError={e=>{(e.currentTarget as HTMLImageElement).src=`https://i.ytimg.com/vi/${x.videoId}/hqdefault.jpg`}}/>:<img src={`https://i.ytimg.com/vi/${x.videoId}/maxresdefault.jpg`} alt="" loading="lazy"/>}<button aria-label="Reproducir" onClick={e=>{e.stopPropagation();playResult(x)}}>{icon("M8 5v14l11-7z")}</button></div>
<div className="cardMeta"><b>{x.title}</b><span>{x.artist}</span>{x.album&&<small>{x.album}</small>}</div></article>)}</div>}
</div></div>)}
{searching&&<div className="message assistant"><div className="assistantAvatar">M</div><div className="thinking"><i/><i/><i/></div></div>}
</div>}
</section>

<form className="composer" onSubmit={e=>{e.preventDefault();search()}}>
<button type="button" className="attach" aria-label="Adjuntar">＋</button><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Pregunta lo que quieras sobre música..." aria-label="Buscar música"/><button type="submit" className="send" disabled={searching||!q.trim()} aria-label="Enviar">{icon("M5 12l5 5L20 7")}</button>
<div className="composerHint">Mfly puede mostrar resultados de YouTube Music</div>
</form>
</section>

<audio ref={audio} onEnded={()=>setPlaying(false)} preload="metadata"/>
{selected&&<div className="playerModal" onClick={()=>setSelected(null)}><div className="playerCard" onClick={e=>e.stopPropagation()}><button className="close" aria-label="Cerrar" onClick={()=>setSelected(null)}>{icon("M6 6l12 12M18 6L6 18")}</button>{selected.artwork&&<img src={selected.artwork} alt=""/>}<h2>{selected.title}</h2><p>{selected.artist}</p><div className="embed"><iframe title={selected.title} src={"https://www.youtube.com/embed/"+selected.videoId+"?autoplay=1&rel=0"} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/></div><a className="openExternal" href={"https://music.youtube.com/watch?v="+selected.videoId} target="_blank" rel="noreferrer">Abrir en YouTube Music ↗</a></div></div>}

<footer className="playerBar">{current?<><div className="now"><div className="mini">{current.title[0]}</div><div><b>{current.title}</b><span>{current.artist}</span></div></div><div className="player"><div className="controls"><button aria-label="Anterior">{icon("M6 6v12M18 6l-8 6 8 6z")}</button><button className="mainPlay" aria-label="Reproducir" onClick={toggle}>{icon(playing?"M8 6h3v12H8zM13 6h3v12h-3z":"M8 5v14l11-7z")}</button><button aria-label="Siguiente" onClick={next}>{icon("M18 6v12M6 6l8 6-8 6z")}</button></div><div className="bar"><i style={{width:`${progress*100}%`}}/></div></div><span>{current.duration||"Now playing"}</span></div></>:<div className="playerEmpty">Selecciona una canción para reproducir</div>}</footer>
</main>}