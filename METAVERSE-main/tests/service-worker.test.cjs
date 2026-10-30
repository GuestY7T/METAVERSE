const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadServiceWorker(options = {}) {
  const handlers = new Map();
  const cached = [];
  const cache = {
    addAll: async paths => { if (options.failPrecache) throw new Error('precache failed'); cached.push(...paths); },
    put: async () => {}
  };
  const cacheStore = {
    open: async () => cache,
    keys: async () => ['metaverse-v3', 'metaverse-v4', 'metaverse-v5'],
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

test('offline app shell includes the real index, logo, viewer, and local runtime scripts', async () => {
  const { handlers, cached } = loadServiceWorker();
  const pending = [];
  handlers.get('install')({ waitUntil: promise => pending.push(promise) });
  await Promise.all(pending);
  for (const asset of [
    './index.html',
    './assets/metaverse-mark.svg',
    './avatar-viewer.js',
    './player-foundation.js',
    './metaverse-shared-sync-v1.js',
    './metaverse-connect-bridge.js',
    './runtime-foundation.js',
    './offline.html'
  ]) {
    assert.ok(cached.includes(asset), 'missing app-shell asset: ' + asset);
  }
});

test('service worker cache version is bumped for the real player hub', () => {
  const source = fs.readFileSync(__dirname + '/../service-worker.js', 'utf8');
  assert.match(source, /CACHE_NAME = 'metaverse-v6'/);
});

test('incomplete app-shell precache rejects service-worker installation', async () => {
  const { handlers } = loadServiceWorker({ failPrecache: true });
  const pending = [];
  handlers.get('install')({ waitUntil: promise => pending.push(promise) });
  await assert.rejects(Promise.all(pending), /precache failed/);
});

test('active index contains the logo, real avatar viewer, and usable profile controls', () => {
  const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  assert.match(html, /assets\/metaverse-mark\.svg/);
  assert.match(html, /avatar-viewer\.js/);
  assert.match(html, /id="avatar-canvas"/);
  assert.match(html, /id="profile-form"/);
  assert.match(html, /player-foundation/);
});
