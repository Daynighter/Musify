export interface Track { id:string; title:string; artist:string; album?:string; durationMs?:number; artworkUrl?:string; }
export interface MusicProvider { search(query:string):Promise<Track[]>; getTrack(id:string):Promise<Track|null>; }
