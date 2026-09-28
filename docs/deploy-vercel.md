# Despliegue de Musify en Vercel

- Framework: Next.js
- Root Directory: raíz del repositorio
- Install Command: pnpm install
- Build Command: pnpm --filter @musify/web build

No necesitas Docker ni PostgreSQL para probar el MVP actual.

Vercel proporciona un dominio vercel.app y permite añadir un dominio propio desde Domains.

La PWA usa HTTPS, manifest, iconos, service worker y Media Session. La reproducción en segundo plano depende del navegador y del sistema operativo.
