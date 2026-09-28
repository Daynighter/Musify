import Fastify from "fastify";
import cors from "@fastify/cors";
const app=Fastify({logger:true});
await app.register(cors,{origin:true});
app.get("/health",async()=>({ok:true,service:"musify-api"}));
app.get("/api/tracks",async()=>({tracks:[{id:"1",title:"Neon Skies",artist:"Luma",album:"Afterglow"},{id:"2",title:"Midnight Drive",artist:"Nova",album:"City Lights"}]}));
app.post("/api/playlists",async(request,reply)=>{const body=request.body as {name?:string}; if(!body?.name)return reply.code(400).send({error:"Playlist name is required"}); return reply.code(201).send({id:crypto.randomUUID(),name:body.name,tracks:[]});});
const port=Number(process.env.PORT||4000);await app.listen({port,host:"0.0.0.0"});
