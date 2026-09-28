import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q=req.nextUrl.searchParams.get("q")?.trim();
  if(!q)return NextResponse.json({items:[]});
  const apiUrl=process.env.MFLY_API_URL||"http://localhost:4000";
  try{
    const response=await fetch(apiUrl+"/api/search?q="+encodeURIComponent(q),{next:{revalidate:30}});
    const data=await response.json();
    return NextResponse.json(data,{status:response.status});
  }catch{
    return NextResponse.json({error:"Mfly API is unavailable",items:[]},{status:502});
  }
}