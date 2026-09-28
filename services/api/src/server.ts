import { spawn } from "node:child_process";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const app=Fastify({logger:true});
await app.register(cors,{origin:true});

const here=dirname(fileURLToPath(import.meta.url));
const searchScript=join(here,"../innertube/search.py");

type SearchItem={videoId:string;title:string;artist:string;album?:string;artwork?:string};

function runInnerTubeSearch(query:string):Promise<SearchItem[]>{
  return new Promise((resolve,reject)=>{
    const command=process.env.PYTHON_BIN||"python3";
    const child=spawn(command,[searchScript,query],{stdio:["ignore","pipe","pipe"]});
    let stdout="";let stderr="";
    child.stdout.setEncoding("utf8");child.stderr.setEncoding("utf8");
    child.stdout.on("data",(chunk)=>{stdout+=chunk});
    child.stderr.on("data",(chunk)=>{stderr+=chunk});
    child.on("error",reject);
    child.on("close",(code)=>{
      if(code!==0)return reject(new Error(stderr||`InnerTube exited with code ${code}`));
      try{
        const data=JSON.parse(stdout);
        resolve(Array.isArray(data.items)?data.items:[]);
      }catch(error){reject(error)}
    });
  });
}

app.get("/health",async()=>({ok:true,service:"mfly-api",provider:"tombulled/innertube"}));

app.get("/api/search",async(request,reply)=>{
  const query=request.query as {q?:string};
  const q=query.q?.trim();
  if(!q)return {items:[]};
  try{return {items:await runInnerTubeSearch(q)}}
  catch(error){
    request.log.error(error);
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