# METAVERSE

This repository now treats `METAVERSE-main/` as the canonical application folder.

## Overview

METAVERSE is a browser-based virtual world prototype inspired by social sandbox games and platform hubs. It combines a dashboard-style UI, avatar/shop concepts, social panels, mini-game cards, and a service-worker-backed offline shell.

The project is structured as:

- `METAVERSE-main/` — active app source and runtime
- root folder — compatibility redirect and repo entrypoint

## Active app

Use the app under `METAVERSE-main/`.

```bash
cd METAVERSE-main
npx http-server -p 8080
```

Then open:

```text
http://localhost:8080
```

## Repository layout

```text
METAVERSE/
├── README.md                 # repo guide
├── index.html                # compatibility redirect to the active app
├── service-worker.js         # minimal redirect/cache shell
├── package.json              # root package scripts
├── METAVERSE-main/
│   ├── index.html            # main app shell / runtime entry
│   ├── service-worker.js     # active app offline cache behavior
│   ├── manifest.json         # PWA manifest
│   ├── offline.html          # offline fallback
│   ├── runtime-foundation.js # runtime capability profiling helper
│   ├── README.md             # canonical app README
│   └── vendor/
│       └── three.0.128.0.min.js
└── ...
```

## What is included

- Social dashboard and game hub layout
- Avatar/shop and world exploration screens
- Mini-game cards and experience browsing
- Basic PWA support via manifest + service worker
- Offline fallback page
- Local asset-first loading with a Three.js vendor fallback

## Quick start

From the repo root:

```bash
npm start
```

This serves the active app from `METAVERSE-main/`.

## Local development notes

- The root folder is intentionally a redirect shell.
- The real app source is in `METAVERSE-main/`.
- The service worker only registers on HTTP(S) after the page load event.
- Offline cache logic is intentionally versioned and scoped to the active app shell.

## Deployment guidance

For a static deployment, deploy the contents of `METAVERSE-main/` as the site root, or serve the repo root with the redirect shell if you intentionally want the repo landing page to redirect into the app.

If using GitHub Pages or static hosting, the recommended path is:

- deploy `METAVERSE-main/` as the actual site root
- keep the repo root redirect only for local/repo convenience

## Status

This repo has been cleaned up to a single canonical app structure. The active runtime is the nested app folder, and the root repo acts as a compatibility redirect instead of a competing app shell.

This is a good maintenance baseline, but the app should still be treated as a frontend prototype and evaluated in a browser before claiming full production readiness.
