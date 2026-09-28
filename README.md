# Mfly

Mfly es una PWA musical con una interfaz conversacional: busca música, descubre artistas, guarda playlists y controla un reproductor desde una sola pantalla.

## Vercel

Importa el repositorio en Vercel con Root Directory /. Usa npm install y npm run build. Añade la variable de entorno YOUTUBE_API_KEY para activar las búsquedas de YouTube.

## YouTube API

Mfly usa YouTube Data API v3 para buscar metadatos y resultados. La clave se mantiene en el servidor mediante YOUTUBE_API_KEY y no se envía al navegador.

La API oficial de YouTube no sirve para extraer MP3 ni separar pistas de audio. Sus políticas también prohíben usar la API para permitir reproducción en segundo plano del reproductor de YouTube. Por eso Mfly no implementa extracción de audio de YouTube ni descarga de MP3. Los resultados se abren en YouTube y el reproductor PWA usa audio que tengas derecho a distribuir.

## PWA

Incluye manifest, service worker y Media Session para controles multimedia en navegadores compatibles. La reproducción en segundo plano depende del navegador y del sistema operativo.

## Desarrollo

npm install
npm run dev

Abre http://localhost:3000.
