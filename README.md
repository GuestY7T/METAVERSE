# METAVERSE

`METAVERSE-main/` is the canonical and only runtime source for this project.

## Quick start

From repository root:

```bash
npm start
```

Or directly from the app folder:

```bash
cd METAVERSE-main
npx http-server -p 8080
```

Open:

```text
http://localhost:8080
```

## Structure

- `METAVERSE-main/` - active application code and assets
- `index.html` - root compatibility redirect to `METAVERSE-main/index.html`
- root docs - repository-level notes

## Deployment

Deploy `METAVERSE-main/` as the site root for production/static hosting.

## Status

Repository structure is consolidated to avoid split runtime behavior and stale duplicate assets at root.
