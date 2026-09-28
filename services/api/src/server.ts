import Fastify from "fastify";
import cors from "@fastify/cors";

const app=Fastify({logger:true});
await app.register(cors,{origin:true});

const INNERTUBE_URL="https://music.youtube.com/youtubei/v1/search?prettyPrint=false";
const CLIENT_VERSION="1.20260915.01.00";

type Renderer=Record<string,any>;

function textOf(value:any):string{
  if(!value)return "";
  if(typeof value==="string")return value;
  if(Array.isArray(value))return value.map(textOf).join("");
  if(Array.isArray(value.runs))return value.runs.map((r:any)=>r.text||"").join("");
  return value.simpleText||value.text||"";
}

function findRenderers(node:any,out:Renderer[]=[]):Renderer[]{
  if(!node||typeof node!=="object")return out;
  if(Array.isArray(node)){
    for(const item of node)findRenderers(item,out);
    return out;
  }
  for(const [key,value] of Object.entries(node)){
    if(key==="musicResponsiveListItemRenderer"||key==="videoRenderer")out.push(value as Renderer);
    else findRenderers(value,out);
  }
  return out;
}

function mapItem(renderer:Renderer){
  const videoId=renderer.videoId;
  const flex=renderer.flexColumns||[];
  const title=textOf(renderer.title)||textOf(flex?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text)||"Sin título";
  const second=flex?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text;
  const secondText=textOf(second);
  const runs=second?.runs||[];
  const artist=runs?.[0]?.text||secondText.split(" • ")[0]||"YouTube Music";
  const thumbnails=renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails||renderer.thumbnail?.thumbnails||[];

  return {
    videoId,
    title,
    artist,
    album:secondText.includes(" • ")?secondText.split(" • ").slice(-1)[0]:undefined,
    artwork:thumbnails.at(-1)?.url,
  };
}

app.get("/health",async()=>({ok:true,service:"mfly-api"}));

app.get("/api/search",async(request,reply)=>{
  const query=request.query as {q?:string};
  const q=query.q?.trim();
  if(!q)return {items:[]};

  try{
    const response=await fetch(INNERTUBE_URL,{
      method:"POST",
      headers:{
        "content-type":"application/json",
        "origin":"https://music.youtube.com",
        "user-agent":"Mozilla/5.0",
      },
      body:JSON.stringify({
        context:{client:{
          clientName:"WEB_REMIX",
          clientVersion:CLIENT_VERSION,
          hl:"es",
          gl:"ES",
        }},
        query:q,
      }),
    });

    if(!response.ok){
      return reply.code(502).send({error:"Music provider search failed",items:[]});
    }

    const data=await response.json();
    const items=findRenderers(data)
      .map(mapItem)
      .filter((item)=>item.videoId)
      .filter((item,index,all)=>all.findIndex((x)=>x.videoId===item.videoId)===index)
      .slice(0,20);

    return {items};
  }catch{
    return reply.code(502).send({error:"Music provider is unavailable",items:[]});
  }
});

app.get("/api/tracks",async()=>({tracks:[
  {id:"1",title:"Neon Skies",artist:"Luma",album:"Afterglow"},
  {id:"2",title:"Midnight Drive",artist:"Nova",album:"City Lights"}
]}));

app.post("/api/playlists",async(request,reply)=>{
  const body=request.body as {name?:string};
  if(!body?.name)return reply.code(400).send({error:"Playlist name is required"});
  return reply.code(201).send({id:crypto.randomUUID(),name:body.name,tracks:[]});
});

const port=Number(process.env.PORT||4000);
await app.listen({port,host:"0.0.0.0"});