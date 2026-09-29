# Mfly

Mfly es una PWA musical con interfaz conversacional. Escribes una canción, artista o búsqueda y Mfly muestra resultados en formato de carátulas, con un reproductor persistente en la parte inferior.

## Qué hace

- Búsqueda musical desde el chat.
- Resultados en grids de carátulas.
- Título, artista y álbum cuando están disponibles.
- Reproducción al pulsar una carátula.
- Cola con anterior / reproducir-pausar / siguiente.
- Barra de progreso y búsqueda dentro de la pista.
- Diseño responsive para escritorio y móvil.
- PWA preparada para instalación.
- API de búsqueda en Next.js, sin exponer credenciales al navegador.

## Arquitectura

```text
Mfly
├── apps/web/                 # aplicación Next.js
│   ├── app/page.tsx          # interfaz y reproductor
│   ├── app/globals.css       # estilos
│   └── app/api/music/search/  # búsqueda musical en servidor
├── package.json              # workspace raíz y scripts
└── vercel.json               # build de Vercel
```

El frontend llama siempre a:

```text
/api/music/search?q=...
```

No se debe hard-codear `mfly.vercel.app` dentro del frontend. De esta forma, el mismo código funciona en desarrollo, preview y producción. El dominio final se configura en Vercel.

## Reproducción

La interfaz de Mfly está pensada para mostrar **música como carátulas**, no vídeos como contenido principal.

La reproducción se realiza mediante el reproductor oficial integrado de YouTube. Mfly controla la reproducción desde su interfaz personalizada, mientras que la fuente de reproducción sigue siendo el reproductor autorizado.

Mfly no descarga MP3, no extrae archivos de audio de YouTube y no intenta convertir vídeos en archivos de audio.

## Búsqueda

La ruta:

```text
GET /api/music/search?q=nombre+de+cancion
```

devuelve:

```json
{
  "items": [
    {
      "videoId": "…",
      "title": "…",
      "artist": "…",
      "album": "…",
      "artwork": "…"
    }
  ]
}
```

La búsqueda intenta primero resultados musicales y dispone de un fallback de búsqueda de vídeos cuando el proveedor musical no devuelve resultados.

## Desarrollo local

Requisitos:

- Node.js 22.14 o superior.
- npm 11.

Instalación:

```bash
npm install
```

Desarrollo:

```bash
npm run dev
```

Después abre:

```text
http://localhost:3000
```

Comprobaciones:

```bash
npm run typecheck
npm run build
```

## Vercel

El repositorio está preparado para desplegarse desde la **raíz del repositorio**.

Configuración recomendada:

- Repository: `Daynighter/Musify`
- Production Branch: `main`
- Root Directory: `/`
- Framework Preset: Next.js
- Install Command: `npm install`
- Build Command: `npm run build`

No configures `apps/web` como Root Directory si quieres utilizar los scripts y workspace de la raíz.

### Dominio

El dominio de producción puede ser:

```text
https://mfly.vercel.app
```

El código no depende de ese dominio. Las llamadas internas utilizan rutas relativas como `/api/music/search`.

Esto evita que una Preview Deployment termine llamando a la API de otra deployment.

## Sincronización GitHub → Vercel

La fuente de verdad del código es:

```text
GitHub: Daynighter/Musify
Branch: main
```

Cada cambio debe terminar como un commit en `main`.

Si Vercel muestra una versión antigua:

1. Comprueba que el commit nuevo aparece en GitHub en `main`.
2. Comprueba en Vercel que el proyecto está conectado a `Daynighter/Musify`.
3. Comprueba que Production Branch es `main`.
4. Comprueba que Root Directory es `/`.
5. Comprueba el commit asociado al deployment.
6. Si el deployment está construido desde un commit antiguo, vuelve a desplegar el commit actual de `main`.
7. No edites el código directamente en una Preview URL: el código debe cambiar en GitHub.

## Caché y PWA

Mfly puede utilizar un service worker. Si durante el desarrollo aparece una versión antigua después de un deployment, prueba una recarga completa o elimina los datos del sitio/PWA instalada.

La aplicación debe poder ejecutarse correctamente incluso sin depender de una URL de deployment concreta.

## Estructura de versiones

No se deben mantener dos frontends distintos para producción y preview.

La misma aplicación:

```text
GitHub main
   ↓
Vercel build
   ↓
mfly.vercel.app
```

debe ser la referencia de producción.

## Estado del proyecto

El objetivo actual de Mfly es:

```text
chat
  ↓
búsqueda musical
  ↓
carátulas
  ↓
seleccionar canción
  ↓
reproductor inferior persistente
  ↓
cola / progreso / controles
```

La interfaz debe priorizar la experiencia musical y las carátulas, con una apariencia cercana a una aplicación de streaming musical, sin convertir la pantalla principal en un reproductor de vídeo.
