# METAVERSE

METAVERSE is a browser-first game platform prototype. The canonical active app is in `METAVERSE-main/`.

## Current player hub

- `index.html` is the actual active player hub, not a redirect or empty script shell.
- `assets/metaverse-mark.svg` is the METAVERSE brand mark used by the page and app icon.
- `avatar-viewer.js` renders a rigged GLB humanoid using Three.js, fits the full model to the viewport, supports touch/mouse orbit controls, and plays available named animation clips.
- The current preview model is Gobkit's RampAgent, published as CC0 1.0. Its exact asset URL is recorded in the viewer source. The remote model and Three.js CDN require an internet connection; the app shell and fallback silhouette remain available offline.
- Player display names are saved locally through Player Foundation. Cloud sync remains disabled.
- Equipment slots are saved and emit renderer-facing events, but real wearable attachment meshes, a closet catalogue, and saved outfit management are not yet implemented.

## Player Foundation

The local-first API validates bounded positions, sanitized display names, and allowlisted equipment slots. It supports local save/load/reset, cross-tab restoration, runtime capture, and final flush. Cloud writes remain disabled until the Supabase authorization, RLS, revision, and conflict contract is audited.

## Offline reliability

The service worker uses cache `metaverse-v6`, precaches the active page, logo, viewer, and local runtime scripts, and fails installation if required app-shell assets cannot be cached. Third-party Three.js and the GLB model are not currently bundled, so full 3D rendering requires network access.

## Validation

Run `npm test` from `METAVERSE-main/`. Tests cover player persistence, runtime restoration, app-shell assets, and fail-closed service-worker installation.

## Known limitations

- Browser-level verification is still required on desktop and iPad Safari.
- The active runtime does not yet expose a world-selection API.
- Avatar equipment data is persisted but not attached to the humanoid skeleton.
- Authentication, multiplayer authority, and cloud persistence are not production-ready.
