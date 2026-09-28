import Fastify from "fastify";
import cors from "@fastify/cors";

const app=Fastify({logger:true});
await app.register(cors,{origin:true});

app.get("/health",async()=>({ok:true,service:"mfly-api"}));

app.get("/api/search",async(request,reply)=>{
  const query=request.query as {q?:string};
  const q=query.q?.trim();
  const key=process.env.YOUTUBE_API_KEY;
  if(!q)return {items:[]};
  if(!key)return reply.code(500).send({error:"YOUTUBE_API_KEY is not configured",items:[]});

  const url=new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part","snippet");
  url.searchParams.set("q",q);
  url.searchParams.set("type","video");
  url.searchParams.set("videoCategoryId","10");
  url.searchParams.set("maxResults","20");
  url.searchParams.set("key",key);

  try{
    const response=await fetch(url);
    const data=await response.json() as any;
    if(!response.ok)return reply.code(response.status===403?502:response.status).send({error:data?.error?.message||"YouTube Search API error",items:[]});
    const items=(data.items||[]).map((item:any)=>({
      videoId:item.id?.videoId,
      title:item.snippet?.title||"Sin título",
      artist:item.snippet?.channelTitle||"YouTube",
      artwork:item.snippet?.thumbnails?.high?.url||item.snippet?.thumbnails?.medium?.url||item.snippet?.thumbnails?.default?.url,
      description:item.snippet?.description||"",
      publishedAt:item.snippet?.publishedAt,
    })).filter((item:any)=>item.videoId);
    return {items};
  }catch{
    return reply.code(502).send({error:"Could not reach YouTube Search API",items:[]});
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