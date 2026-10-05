# METAVERSE

This repository now treats `METAVERSE-main/` as the canonical application folder.

## Active app

Use the app under `METAVERSE-main/`.

```bash
cd METAVERSE-main
npx http-server -p 8080
```

The root folder now acts as a small compatibility redirect so the repo does not run two conflicting app shells at the same time.

## Repository status

- Canonical app: `METAVERSE-main/`
- Legacy root shell: compatibility redirect only
- Offline caching: hardened and scoped to the active app
- Service worker registration: only runs on HTTP(S) after load

## Quick launch

```bash
npm start
```

This starts the active project from the nested app folder.
