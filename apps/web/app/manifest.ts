import type { MetadataRoute } from "next";
export default function manifest():MetadataRoute.Manifest{return{name:"Musify",short_name:"Musify",description:"Tu música, tu manera.",start_url:"/",display:"standalone",background_color:"#09090c",theme_color:"#09090c",icons:[{src:"/icon.svg",sizes:"any",type:"image/svg+xml"}]};}
