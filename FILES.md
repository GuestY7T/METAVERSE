Project file overview — short descriptions

- index.html  
  App entry — registers the service worker and loads the game UI.

- web777game.html  
  The 3D game/world page that runs the Three.js experience.

- website777.html  
  Public/login/auxiliary site pages (auth, marketing).

- manifest.json  
  PWA metadata (icons, start_url, scope). Set start_url to "./" for project pages.

- service-worker.js  
  Service worker: precaches same-origin assets, network-first for navigations with offline fallback.

- offline.html  
  Friendly offline fallback displayed when navigation fails while offline.

- vendor/three.min.js  
  Vendored copy of Three.js to ensure offline availability and consistent caching.

- docs/METAVERSE_v1.4.html  
  Archived large release snapshot / historical HTML (moved to docs/).

- docs/READY_TO_DEPLOY.txt  
  Deployment instructions and notes (moved to docs/).

- dev/*  
  Development sandbox and experimental pages (not deployed to production).

- LICENSE  
  Project license (Apache 2.0).
