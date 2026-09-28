import type { ReactNode } from "react";
import "./globals.css";
export const metadata={title:"Musify",description:"Discover, organize, and enjoy your music."};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body>{children}</body></html>}
