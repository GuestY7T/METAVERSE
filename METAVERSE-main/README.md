# METAVERSE

This repository contains both a legacy root snapshot and a newer app release under `METAVERSE-main/`.

Canonical active app: `METAVERSE-main/`
Legacy root files: kept only as a compatibility mirror and should not be treated as the active project source.

This repository is being cleaned up and stabilized. The active release is the nested app folder, and the runtime files in it now use safer service worker registration and cache handling.

## Quick local run

```bash
cd METAVERSE-main
npx http-server -p 8080
```

Then open http://localhost:8080
