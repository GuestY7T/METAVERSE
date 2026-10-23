const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadServiceWorker() {
  const handlers = new Map();
  const cached = [];
  const cache = {
    addAll: async paths => { cached.push(...paths); },
    put: async () => {}
  };
  const cacheStore = {
    open: async () => cache,
    keys: async () => ['metaverse-v3', 'metaverse-v4'],
    delete: async key => key !== 'metaverse-v3',
    match: async () => null
  };
  const self = {
    location: { origin: 'https://metaverse.test' },
    clients: { claim: async () => {} },
    addEventListener: (type, fn) => handlers.set(type, fn),
    skipWaiting: () => {}
  };
  const context = {
    self, caches: cacheStore, URL, Response,
    fetch: async () => { throw new Error('offline'); },
    console: { warn: () => {} },
    Promise
  };
  vm.runInNewContext(fs.readFileSync(__dirname + '/../service-worker.js', 'utf8'), context);
  return { handlers, cached, cacheStore };
}

test('offline app shell includes every local script loaded by index.html', async () => {
  const { handlers, cached } = loadServiceWorker();
  const pending = [];
  handlers.get('install')({ waitUntil: promise => pending.push(promise) });
  await Promise.all(pending);
  for (const asset of [
    './index.html',
    './player-foundation.js',
    './metaverse-shared-sync-v1.js',
    './metaverse-connect-bridge.js',
    './runtime-foundation.js',
    './offline.html'
  ]) {
    assert.ok(cached.includes(asset), 'missing app-shell asset: ' + asset);
  }
});

test('service worker cache version is bumped for the new app shell', () => {
  const source = fs.readFileSync(__dirname + '/../service-worker.js', 'utf8');
  assert.match(source, /CACHE_NAME = 'metaverse-v4'/);
});
