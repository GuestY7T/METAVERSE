# METAVERSE

This is the active application folder for the repo.

## Local run

```bash
cd METAVERSE-main
npx http-server -p 8080
```

Then open http://localhost:8080

## Notes

- The root folder is a compatibility redirect.
- The canonical app lives here.
- Service worker registration is only enabled on HTTP(S) after load.
- Offline caching is intentionally scoped and versioned.
