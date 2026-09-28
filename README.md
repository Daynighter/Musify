# Musify

Musify es una PWA musical construida con Next.js.

## Deploy en Vercel

1. Importa este repositorio en Vercel.
2. Mantén el Root Directory en la raíz del repositorio.
3. Vercel detectará Next.js automáticamente.
4. Usa pnpm install como instalación y pnpm --filter @musify/web build como build.
5. Pulsa Deploy.

Vercel te dará una URL HTTPS como https://musify-xxxxx.vercel.app. Después puedes conectar un dominio propio, por ejemplo https://musify.es.

## Local

pnpm install
pnpm dev

La aplicación incluye manifest PWA, service worker y Media Session para controles multimedia en navegadores compatibles.
