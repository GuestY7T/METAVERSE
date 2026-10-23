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


## Player Foundation (feature branch)

The Player Foundation provides a validated, local-first player profile and position snapshot. It persists a sanitized display name, bounded world position, and allowlisted equipment slots (head, torso, legs, feet) in browser storage.

### Integration API

- METAVERSE_PLAYER_FOUNDATION.loadLocal() — load a validated snapshot.
- saveLocal(state) — validate and persist the supported snapshot fields.
- setDisplayName(name) — update a sanitized display name.
- setCustomization(slot, itemId) — save an allowlisted equipment slot and safe item identifier.
- resetLocal() — clear only the Player Foundation storage key.
- flush(runtime) — capture the current runtime position/name and persist it.
- applyRuntime(runtime, state) — restore validated position and display name.
- cloudSyncEnabled remains false until the existing Supabase write contract and authorization rules are audited.

Successful local writes emit metaverse:player-state-changed. UI code can request a customization change by dispatching metaverse:equipment-change with { slot, itemId }. This API persists the choice; rendering the selected item on an avatar requires a separate, explicit avatar-renderer integration.

### Offline behavior

The service worker cache is versioned as metaverse-v4 and includes the Player Foundation, shared-sync bridge, Connect bridge, and runtime script. This keeps the app shell's local integration scripts available after a successful cache install. It does not guarantee offline access to remote services or assets that are not in the shell cache.

### Safety boundary

This browser-side state is convenience persistence, not authoritative security. Never trust client state for account identity, currency, inventory ownership, moderation roles, rewards, or multiplayer authority. Do not enable cloud writes until server-side authorization, schema compatibility, revision/conflict handling, and RLS/RPC behavior have been verified.
