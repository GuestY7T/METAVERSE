# METAVERSE

This is the canonical application folder for the repository.

## Overview

METAVERSE is a browser-based virtual world prototype inspired by social sandbox games and platform hubs. It combines a dashboard-style UI, avatar/shop concepts, social panels, mini-game cards, and a service-worker-backed offline shell.

## Local run

From this folder:

```bash
npx http-server -p 8080
```

Then open:

```text
http://localhost:8080
```

## What is included

- Social dashboard and game hub layout
- Avatar/shop and world exploration screens
- Mini-game cards and experience browsing
- Basic PWA support via manifest + service worker
- Offline fallback page
- Local asset-first loading with a Three.js vendor fallback

## Development notes

- This folder is the active app source.
- The repository root is a compatibility redirect shell.
- Service worker registration is enabled only on HTTP(S) after page load.
- Offline cache behavior is intentionally versioned and scoped.

## Deployment guidance

For static deployment, publish this folder as the site root.

## Status

This app is in a good maintenance baseline and should continue to be validated in-browser as a frontend prototype.
