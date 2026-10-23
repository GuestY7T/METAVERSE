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
    values
  };
  const context = { window, globalThis: window, Date, Number, Math, String, JSON, Object, Array, RegExp };
  vm.runInNewContext(fs.readFileSync(__dirname + '/../player-foundation.js', 'utf8'), context);
  return window.METAVERSE_PLAYER_FOUNDATION;
}

test('position requires finite bounded coordinates', () => {
  const api = loadFoundation();
  assert.deepEqual(JSON.parse(JSON.stringify(api.validatePosition({ x: 2, y: 0, z: -3, worldId: 'hub' }))), { x: 2, y: 0, z: -3, worldId: 'hub' });
  assert.equal(api.validatePosition({ x: Infinity, y: 0, z: 0 }), null);
  assert.equal(api.validatePosition({ x: 0, y: -1, z: 0 }), null);
  assert.equal(api.validatePosition({ x: 100001, y: 0, z: 0 }), null);
});

test('equipment accepts only known slots and safe item identifiers', () => {
  const api = loadFoundation();
  const got = JSON.parse(JSON.stringify(api.validateEquipment({ head: 'hat:blue', feet: '../secret', extra: 'ignored' })));
  assert.equal(got.head, 'hat:blue');
  assert.equal(got.feet, null);
  assert.equal(Object.hasOwn(got, 'extra'), false);
});

test('state allowlist excludes caller-supplied IDs, currency, inventory, and roles', () => {
  const api = loadFoundation();
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
  const api = loadFoundation();
  const result = api.saveLocal({ displayName: 'Builder', position: { x: 4, y: 0, z: 7, worldId: 'hangar' } });
  assert.equal(result.ok, true);
  assert.equal(api.loadLocal().displayName, 'Builder');
  assert.equal(api.loadLocal().position.worldId, 'hangar');
});

test('cloud writes stay disabled until a trusted persistence contract exists', () => {
  const api = loadFoundation();
  assert.equal(api.cloudSyncEnabled, false);
});
