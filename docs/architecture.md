# Musify Architecture

- **apps/web** — user-facing web application.
- **services/api** — backend API for authentication, catalog, playlists, history, and recommendations.
- **services/ytmusic** — optional provider adapter for unofficial YouTube Music integrations; keep provider-specific code isolated.
- **packages/music-core** — shared domain models and provider interfaces.

## Principles
1. Keep provider integrations behind stable interfaces.
2. Keep playback state independent from catalog providers.
3. Keep user data in Musify-owned services and storage.
4. Prefer typed contracts between applications and services.
5. Build the MVP first, then expand recommendations and social features.
