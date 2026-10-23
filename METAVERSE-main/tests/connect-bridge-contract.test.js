#!/usr/bin/env node
'use strict';

// Dependency-free contract tests for the METAVERSE ↔ Connect browser bridge.
// These tests exercise the bridge against a deterministic mock of the shared
// client. They do not claim live Supabase, RLS, deployment, or browser proof.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const bridgePath = path.join(__dirname, '..', 'metaverse-connect-bridge.js');
const bridgeSource = fs.readFileSync(bridgePath, 'utf8');

function createHarness() {
  const listeners = new Map();
  const dispatched = [];
  const calls = { localWrites: [], syncs: [], retryPending: 0, signIns: 0, signOuts: 0 };
  let localState = { profile: { displayName: 'Local Player' } };

  const shared = {
    readLocalState() { return localState; },
    writeLocalState(snapshot) { localState = snapshot; calls.localWrites.push(snapshot); return snapshot; },
    async getUser() { return { data: { user: null }, error: null }; },
    async signIn() { calls.signIns += 1; return { data: {}, error: null }; },
    async signUp() { return { data: { session: null }, error: null }; },
    async signOut() { calls.signOuts += 1; return { error: null }; },
    async sync(snapshot) { calls.syncs.push(snapshot); return { mode: 'cloud', revision: calls.syncs.length }; },
    async pullCloud() { return { data: { state: { profile: { displayName: 'Cloud Player' } } }, error: null }; },
    getCapabilities() { return { local: true, cloud: true }; },
    async retryPending() { calls.retryPending += 1; return { mode: 'cloud' }; }
  };

  const window = {
    METAVERSE_SHARED_SYNC: shared,
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    dispatchEvent(event) {
      dispatched.push(event);
      for (const fn of listeners.get(event.type) || []) fn(event);
      return true;
    }
  };
  class CustomEvent {
    constructor(type, options = {}) { this.type = type; this.detail = options.detail; }
  }
  const context = { window, CustomEvent, Date, Set, Object, String, Error, Promise, console };
  vm.runInNewContext(bridgeSource, context, { filename: bridgePath });

  return {
    window, calls, dispatched,
    emit(type, detail) { window.dispatchEvent(new CustomEvent(type, { detail })); },
    async settle() { for (let i = 0; i < 8; i += 1) await Promise.resolve(); }
  };
}

(async function main() {
  const h = createHarness();
  const bridge = h.window.METAVERSE_CONNECT_BRIDGE;
  assert.ok(bridge, 'bridge global is published');
  assert.equal(bridge.product, 'METAVERSE');
  assert.equal(bridge.connectedProduct, 'METAVERSE Connect');
  assert.equal(typeof bridge.signIn, 'function');
  assert.equal(typeof bridge.sync, 'function');

  // Ordinary state changes persist locally but must not silently upload.
  const localSnapshot = { profile: { displayName: 'Saved Locally' } };
  h.emit('metaverse:state-changed', { state: localSnapshot });
  assert.equal(h.calls.localWrites.length, 1, 'state event is saved locally');
  assert.equal(h.calls.syncs.length, 0, 'cloud sync is opt-in');

  // Explicit opt-in sends only the declared snapshot to the shared client.
  const cloudSnapshot = { progression: { level: 2, xp: 35 } };
  h.emit('metaverse:state-changed', { syncToConnect: true, state: cloudSnapshot });
  await h.settle();
  assert.equal(h.calls.localWrites.length, 2, 'opt-in snapshot also persists locally');
  assert.equal(h.calls.syncs.length, 1, 'opt-in event triggers one sync');
  assert.equal(h.calls.syncs[0], cloudSnapshot, 'sync receives the explicit snapshot');

  // Unwrapped events remain supported by the documented contract.
  const unwrapped = { settings: { reducedMotion: true } };
  h.emit('metaverse:state-changed', { syncToConnect: true, ...unwrapped });
  await h.settle();
  assert.equal(h.calls.syncs.length, 2, 'unwrapped opted-in state syncs');

  // Public auth wrappers delegate and return without exposing secret material.
  await bridge.signIn('player@example.invalid', 'not-a-real-password');
  await bridge.signOut();
  assert.equal(h.calls.signIns, 1);
  assert.equal(h.calls.signOuts, 1);

  h.emit('online', {});
  await h.settle();
  assert.equal(h.calls.retryPending, 1, 'online event retries queued sync');
  assert.ok(h.dispatched.some(e => e.type === 'metaverse:connect-status'), 'status events are emitted');

  console.log('PASS: METAVERSE ↔ Connect bridge contract (local save, opt-in sync, auth wrappers, retry, status)');
  console.log('LIMIT: mocked shared client only; live browser, Supabase/RLS, two-device sync, and production access remain unverified.');
})().catch(error => {
  console.error('FAIL: METAVERSE ↔ Connect bridge contract');
  console.error(error && error.stack || error);
  process.exitCode = 1;
});
