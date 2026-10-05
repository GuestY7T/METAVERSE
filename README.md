# METAVERSE

This repository contains both a legacy root snapshot and a newer app release under `METAVERSE-main/`.

Canonical active app: `METAVERSE-main/`
Legacy root files: kept only as a compatibility mirror and should not be treated as the active project source.

This branch focuses on cleanup and stabilization:
- document the active release clearly
- remove stale cache assumptions
- make the service worker safer and more portable
- reduce unsafe registration behavior in legacy files

## Quick local run

```bash
cd METAVERSE-main
npx http-server -p 8080
```

Then open http://localhost:8080
