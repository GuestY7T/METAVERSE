const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadFoundation() {
  const values = new Map();
  const listeners = new Map();
  const window = {
    localStorage: {
      getItem: key => values.has(key) ? values.get(key) : null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: key => values.delete(key)
    },
    addEventListener: (name, fn) => {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(fn);
    },
    dispatchEvent: event => (listeners.get(event.type) || []).forEach(fn => fn(event)),
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
    values
  };
  const context = { window, globalThis: window, Date, Number, Math, String, JSON, Object, Array, RegExp };
  vm.runInNewContext(fs.readFileSync(__dirname + '/../player-foundation.js', 'utf8'), context);
  return { api: window.METAVERSE_PLAYER_FOUNDATION, window };
}

test('position requires finite bounded coordinates', () => {
  const { api, window } = loadFoundation();
  assert.deepEqual(JSON.parse(JSON.stringify(api.validatePosition({ x: 2, y: 0, z: -3, worldId: 'hub' }))), { x: 2, y: 0, z: -3, worldId: 'hub' });
  assert.equal(api.validatePosition({ x: Infinity, y: 0, z: 0 }), null);
  assert.equal(api.validatePosition({ x: 0, y: -1, z: 0 }), null);
  assert.equal(api.validatePosition({ x: 100001, y: 0, z: 0 }), null);
});

test('equipment accepts only known slots and safe item identifiers', () => {
  const { api, window } = loadFoundation();
  const got = JSON.parse(JSON.stringify(api.validateEquipment({ head: 'hat:blue', feet: '../secret', extra: 'ignored' })));
  assert.equal(got.head, 'hat:blue');
  assert.equal(got.feet, null);
  assert.equal(Object.hasOwn(got, 'extra'), false);
});

test('state allowlist excludes caller-supplied IDs, currency, inventory, and roles', () => {
  const { api, window } = loadFoundation();
  const state = JSON.parse(JSON.stringify(api.validatePlayerState({
    playerId: 'spoofed', userId: 'spoofed', walletBalance: 999999, premiumCurrency: 999999,
    inventory: ['admin-item'], role: 'owner', displayName: '<Guest>', position: { x: 1, y: 2, z: 3 }
  })));
  assert.equal(state.displayName, 'Guest');
  assert.equal(Object.hasOwn(state, 'playerId'), false);
  assert.equal(Object.hasOwn(state, 'walletBalance'), false);
  assert.equal(Object.hasOwn(state, 'inventory'), false);
  assert.equal(Object.hasOwn(state, 'role'), false);
});

test('local save and load round-trip validated state', () => {
  const { api, window } = loadFoundation();
  const result = api.saveLocal({ displayName: 'Builder', position: { x: 4, y: 0, z: 7, worldId: 'hangar' } });
  assert.equal(result.ok, true);
  assert.equal(api.loadLocal().displayName, 'Builder');
  assert.equal(api.loadLocal().position.worldId, 'hangar');
});

test('cloud writes stay disabled until a trusted persistence contract exists', () => {
  const { api, window } = loadFoundation();
  assert.equal(api.cloudSyncEnabled, false);
});

test('final flush captures the latest runtime position and display name', () => {
  const { api, window } = loadFoundation();
  const runtime = {
    spatial790: { predicted: { x: 10, y: 2, z: -4 } },
    identity784: { globalIdentity: { displayName: 'Builder' } }
  };
  const result = api.flush(runtime);
  assert.equal(result.ok, true);
  const state = api.loadLocal();
  assert.deepEqual(JSON.parse(JSON.stringify(state.position)), { x: 10, y: 2, z: -4, worldId: 'sandbox' });
  assert.equal(state.displayName, 'Builder');
});

test('saved position and display name restore into the runtime', () => {
  const { api, window } = loadFoundation();
  api.saveLocal({ displayName: 'Explorer', position: { x: 12, y: 3, z: 8, worldId: 'hub' } });
  const runtime = {
    spatial790: { predicted: { x: 0, y: 0, z: 0 }, authoritative: { x: 0, y: 0, z: 0 } },
    identity784: {
      globalIdentity: { displayName: 'Guest' },
      sessionContext: { position: { x: 0, y: 0, z: 0 } },
      emitUpdate: function () { this.updated = true; }
    }
  };
  assert.equal(api.applyRuntime(runtime, api.loadLocal()), true);
  assert.deepEqual(JSON.parse(JSON.stringify(runtime.spatial790.predicted)), { x: 12, y: 3, z: 8 });
  assert.equal(runtime.identity784.globalIdentity.displayName, 'Explorer');
  assert.equal(runtime.identity784.sessionContext.position.x, 12);
  assert.equal(runtime.identity784.updated, true);
});

test('customization setter persists allowed slots and rejects unsafe identifiers', () => {
  const { api, window } = loadFoundation();
  const good = api.setCustomization('head', 'hat:blue');
  assert.equal(good.ok, true);
  assert.equal(api.loadLocal().equippedCustomizations.head, 'hat:blue');
  const badSlot = api.setCustomization('admin', 'hat:blue');
  assert.equal(badSlot.ok, false);
  assert.equal(badSlot.reason, 'invalid-slot');
  const badId = api.setCustomization('feet', '../admin');
  assert.equal(badId.ok, false);
  assert.equal(badId.reason, 'invalid-item-id');
  assert.equal(api.loadLocal().equippedCustomizations.feet, null);
});

test('display name updates are sanitized and emit a state-change event', () => {
  const { api, window } = loadFoundation();
  const events = [];
  window.addEventListener('metaverse:player-state-changed', event => events.push(event.detail));
  const result = api.setDisplayName('  <Explorer>  ');
  assert.equal(result.ok, true);
  assert.equal(api.loadLocal().displayName, 'Explorer');
  assert.equal(events.length, 1);
  assert.equal(events[0].displayName, 'Explorer');
  assert.equal(api.setDisplayName('   ').reason, 'invalid-display-name');
  assert.equal(api.validatePlayerState({ displayName: 'Ex\u0000plorer' }).displayName, 'Explorer');
});

test('local reset clears only the player foundation storage key', () => {
  const { api, window } = loadFoundation();
  api.saveLocal({ displayName: 'Builder', position: { x: 5, y: 0, z: 9 } });
  const result = api.resetLocal();
  assert.equal(result.ok, true);
  assert.equal(api.loadLocal().displayName, 'Guest');
  assert.deepEqual(JSON.parse(JSON.stringify(api.loadLocal().position)), { x: 0, y: 0, z: 0, worldId: 'sandbox' });
});
