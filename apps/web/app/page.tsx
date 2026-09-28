"use client";
import { useMemo, useState } from "react";

type Track={id:number;title:string;artist:string;album:string;duration:string};
const tracks:Track[]=[
{id:1,title:"Neon Skies",artist:"Luma",album:"Afterglow",duration:"3:24"},
{id:2,title:"Midnight Drive",artist:"Nova",album:"City Lights",duration:"4:02"},
{id:3,title:"Ocean Echo",artist:"Mira",album:"Tides",duration:"3:41"},
{id:4,title:"Golden Hour",artist:"Atlas",album:"Sunset",duration:"2:58"}
];
export default function Home(){
 const [query,setQuery]=useState(""); const [current,setCurrent]=useState<Track|null>(tracks[0]); const [playing,setPlaying]=useState(false); const [playlist,setPlaylist]=useState<Track[]>([tracks[0],tracks[1]]);
 const results=useMemo(()=>tracks.filter(t=>(t.title+" "+t.artist+" "+t.album).toLowerCase().includes(query.toLowerCase())),[query]);
 const togglePlaylist=(track:Track)=>setPlaylist(p=>p.some(x=>x.id===track.id)?p.filter(x=>x.id!==track.id):[...p,track]);
 return <main className="app"><aside><div className="brand">Musify</div><nav><button>⌂ Home</button><button>⌕ Search</button><button>♡ Your Library</button></nav><section className="side"><b>Playlists</b>{playlist.map(t=><span key={t.id}>{t.title}</span>)}</section></aside><section className="content"><header><input aria-label="Search music" placeholder="Search songs, artists or albums..." value={query} onChange={e=>setQuery(e.target.value)}/></header><section className="hero"><small>DISCOVER MUSIC</small><h1>Listen to what moves you.</h1><p>Search your catalog, build playlists and control playback from one place.</p></section><div className="sectionTitle"><h2>{query?"Search results":"Recommended for you"}</h2><span>{results.length} tracks</span></div><div className="tracks">{results.map(t=><article className="track" key={t.id}><div className="cover">{t.title[0]}</div><div className="meta"><b>{t.title}</b><span>{t.artist} · {t.album}</span></div><button onClick={()=>togglePlaylist(t)}>{playlist.some(x=>x.id===t.id)?"✓":"+"}</button><button className="play" onClick={()=>{setCurrent(t);setPlaying(true)}}>▶</button><time>{t.duration}</time></article>)}</div></section>{current&&<footer><div className="now"><div className="mini">{current.title[0]}</div><div><b>{current.title}</b><span>{current.artist}</span></div></div><div className="player"><div className="controls"><button onClick={()=>setPlaying(false)}>⏮</button><button className="mainPlay" onClick={()=>setPlaying(!playing)}>{playing?"Ⅱ":"▶"}</button><button onClick={()=>setPlaying(true)}>⏭</button></div><div className="bar"><i style={{width:playing?"42%":"0%"}}/></div></div><span>{current.duration}</span></footer>}</main>
}