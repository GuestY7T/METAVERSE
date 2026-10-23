# METAVERSE ↔ METAVERSE Connect bridge

## What this change does
- Reuses the shared identity/cloud-sync client from the Connect repository.
- Loads the same bridge in the game shell and adds a small product boundary: `window.METAVERSE_CONNECT_BRIDGE`.
- Keeps the game usable without a signed-in user; sync failures fall back to local state when supported by the shared client.
- Does not grant friends or connected users access to game state automatically.

## Browser API
- `METAVERSE_CONNECT_BRIDGE.status()`
- `METAVERSE_CONNECT_BRIDGE.onStatus(callback)`
- `METAVERSE_CONNECT_BRIDGE.getUser()`
- `METAVERSE_CONNECT_BRIDGE.signIn(email, password)`
- `METAVERSE_CONNECT_BRIDGE.signUp(email, password, metadata)`
- `METAVERSE_CONNECT_BRIDGE.signOut()`
- `METAVERSE_CONNECT_BRIDGE.getLocalState()`
- `METAVERSE_CONNECT_BRIDGE.saveLocalState(snapshot)`
- `METAVERSE_CONNECT_BRIDGE.sync(snapshot)`
- `METAVERSE_CONNECT_BRIDGE.pullCloud()`
- `METAVERSE_CONNECT_BRIDGE.capabilities()`

## Game state event contract
The game can dispatch `metaverse:state-changed` with a state snapshot as `detail`.
Local state is cached. Cloud sync is deliberately opt-in: set `detail.syncToConnect === true`.
If the snapshot is wrapped, the bridge syncs `detail.state`; otherwise it syncs the detail object.

Example:
```js
window.dispatchEvent(new CustomEvent('metaverse:state-changed', {
  detail: {
    syncToConnect: true,
    state: {
      user: { displayName: 'Player' },
      progression: { level: 1, xp: 0, coins: 0 },
      settings: {},
      world: { lastWorldId: 'home' }
    }
  }
}));
```

## Security and verification boundary
- Browser code contains only the existing Supabase publishable key from the shared client, never a service-role key.
- Actual reads/writes still depend on authenticated identity, RLS, and the existing `write_player_cloud_state` RPC.
- Keep the authoritative rules for inventory, rewards, permissions, purchases, and progression on trusted server-side code.
- CHECKED: source wiring and event contract are present.
- NOT RUNTIME_VERIFIED: two-device sync, auth/RLS, offline replay, revision-conflict recovery, and production CSP behavior must be tested in a running deployment.
