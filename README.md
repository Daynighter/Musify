# Musify

Musify is an installable Progressive Web App (PWA) music player built with Next.js.

## Deploy
Import this repository into Vercel and deploy. Vercel detects Next.js automatically. Open the HTTPS URL on a phone and choose Install app or Add to Home Screen.

## Local
Run pnpm install, then pnpm --filter @musify/web dev and open http://localhost:3000.

## PWA features
- Installable manifest
- Service worker app-shell caching
- Responsive mobile UI
- Media Session controls on supported browsers/devices
- Background playback subject to browser and OS policies

The demo uses remote sample audio URLs. For production, replace them with audio you have the rights to distribute and serve over HTTPS.
