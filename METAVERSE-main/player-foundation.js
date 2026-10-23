(function (root) {
  'use strict';
  var KEY = 'metaverse:player-foundation:v1';
  var SAVE_INTERVAL_MS = 1000;
  var BOUNDS = 100000;
  var lastSaveAt = 0;
  var attached = false;

  function object(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
  function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
  function cleanText(value, max) {
    if (typeof value !== 'string') return '';
    return value.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max);
  }
  function validatePosition(value) {
    if (!object(value)) return null;
    var x = Number(value.x), y = Number(value.y), z = Number(value.z);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
    if (Math.abs(x) > BOUNDS || Math.abs(z) > BOUNDS || y < 0 || y > BOUNDS) return null;
    return { x: x, y: y, z: z, worldId: cleanText(value.worldId || 'sandbox', 80) || 'sandbox' };
  }
  function validateEquipment(value) {
    value = object(value) ? value : {};
    var slots = ['head', 'torso', 'legs', 'feet'];
    var result = {};
    slots.forEach(function (slot) {
      var id = value[slot];
      result[slot] = typeof id === 'string' && /^[a-zA-Z0-9:_-]{1,96}$/.test(id) ? id : null;
    });
    return result;
  }
  function validatePlayerState(value) {
    value = object(value) ? value : {};
    var position = validatePosition(value.position);
    return {
      schemaVersion: 1,
      displayName: cleanText(value.displayName, 80) || 'Guest',
      position: position || { x: 0, y: 0, z: 0, worldId: 'sandbox' },
      equippedCustomizations: validateEquipment(value.equippedCustomizations),
      updatedAt: finite(value.updatedAt) && value.updatedAt > 0 ? value.updatedAt : Date.now()
    };
  }
  function read() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(KEY);
      return raw ? validatePlayerState(JSON.parse(raw)) : validatePlayerState({});
    } catch (_) { return validatePlayerState({}); }
  }
  function write(value) {
    var clean = validatePlayerState(value);
    try {
      if (!root.localStorage) return { ok: false, state: clean, reason: 'storage-unavailable' };
      root.localStorage.setItem(KEY, JSON.stringify(clean));
      return { ok: true, state: clean };
    } catch (_) { return { ok: false, state: clean, reason: 'storage-write-failed' }; }
  }
  function captureRuntime(runtime) {
    if (!runtime) return read();
    var spatial = runtime.spatial790;
    var identity = runtime.identity784;
    var current = read();
    if (spatial && spatial.predicted) {
      current.position = validatePosition({
        x: spatial.predicted.x, y: spatial.predicted.y, z: spatial.predicted.z,
        worldId: current.position.worldId || 'sandbox'
      }) || current.position;
    }
    if (identity && identity.globalIdentity) {
      current.displayName = cleanText(identity.globalIdentity.displayName, 80) || current.displayName;
    }
    current.updatedAt = Date.now();
    return validatePlayerState(current);
  }
  function applyRuntime(runtime, state) {
    if (!runtime) return false;
    state = validatePlayerState(state || read());
    var spatial = runtime.spatial790;
    if (spatial && spatial.predicted && spatial.authoritative) {
      ['x', 'y', 'z'].forEach(function (axis) {
        spatial.predicted[axis] = state.position[axis];
        spatial.authoritative[axis] = state.position[axis];
      });
    }
    var identity = runtime.identity784;
    if (identity && identity.globalIdentity) {
      identity.globalIdentity.displayName = state.displayName;
      if (identity.sessionContext && identity.sessionContext.position) {
        identity.sessionContext.position.x = state.position.x;
        identity.sessionContext.position.y = state.position.y;
        identity.sessionContext.position.z = state.position.z;
      }
      if (typeof identity.emitUpdate === 'function') identity.emitUpdate();
    }
    return true;
  }
  function flush(runtime) {
    // A final save bypasses the movement throttle so the latest position is not lost on exit.
    return write(captureRuntime(runtime || root.MetaverseRuntime));
  }

  function attach() {
    if (attached || !root.addEventListener) return;
    attached = true;
    root.addEventListener('790:state', function () {
      var now = Date.now();
      if (now - lastSaveAt < SAVE_INTERVAL_MS) return;
      lastSaveAt = now;
      flush();
    });
    root.addEventListener('784:update', function () {
      flush();
    });
    root.addEventListener('pagehide', function () {
      flush();
    });
    root.addEventListener('visibilitychange', function () {
      if (root.document && root.document.visibilityState === 'hidden') flush();
    });
    root.addEventListener('metaverse:runtime-ready', function () {
      applyRuntime(root.MetaverseRuntime, read());
    });
  }

  var api = Object.freeze({
    version: '1.0.0',
    storageKey: KEY,
    validatePosition: validatePosition,
    validateEquipment: validateEquipment,
    validatePlayerState: validatePlayerState,
    loadLocal: read,
    saveLocal: write,
    flush: flush,
    applyRuntime: applyRuntime,
    attach: attach,
    cloudSyncEnabled: false
  });
  root.METAVERSE_PLAYER_FOUNDATION = api;
  if (root.addEventListener) attach();
})(typeof window !== 'undefined' ? window : globalThis);
