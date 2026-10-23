/* METAVERSE -> METAVERSE Connect integration boundary.
 * Uses the shared bridge already maintained by METAVERSE Connect.
 * No secrets are embedded here. Cloud writes require the authenticated user
 * and the existing server-side write_player_cloud_state RPC/RLS controls.
 */
(function () {
  'use strict';
  var listeners = new Set();
  var state = { status: 'starting', authenticated: false, lastSync: null, lastError: null };

  function publish(patch) {
    state = Object.assign({}, state, patch || {});
    var detail = Object.assign({}, state);
    window.dispatchEvent(new CustomEvent('metaverse:connect-status', { detail: detail }));
    listeners.forEach(function (fn) { try { fn(detail); } catch (e) {} });
  }
  function shared() {
    if (!window.METAVERSE_SHARED_SYNC) throw new Error('CONNECT_BRIDGE_NOT_LOADED');
    return window.METAVERSE_SHARED_SYNC;
  }
  function readState() {
    try { return shared().readLocalState({}); } catch (e) { return {}; }
  }
  async function refreshAuth() {
    try {
      var result = await shared().getUser();
      var user = result && result.data && result.data.user;
      publish({ authenticated: !!user, userId: user ? user.id : null, status: user ? 'ready' : 'signed-out', lastError: null });
      return user || null;
    } catch (error) {
      publish({ status: 'offline-or-unavailable', lastError: String(error && error.message || error) });
      return null;
    }
  }
  async function sync(stateSnapshot) {
    var api = shared();
    var snapshot = stateSnapshot || readState();
    try {
      var result = await api.sync(snapshot, { fallbackState: snapshot });
      publish({ status: result.mode === 'local_fallback' ? 'offline-local' : 'synced', lastSync: new Date().toISOString(), revision: result.revision || 0, lastError: result.error ? String(result.error.message || result.error) : null });
      return result;
    } catch (error) {
      publish({ status: 'sync-error', lastError: String(error && error.message || error) });
      throw error;
    }
  }
  var api = Object.freeze({
    version: '1.0.0',
    product: 'METAVERSE',
    connectedProduct: 'METAVERSE Connect',
    status: function () { return Object.assign({}, state); },
    onStatus: function (fn) { listeners.add(fn); fn(Object.assign({}, state)); return function () { listeners.delete(fn); }; },
    getUser: function () { return refreshAuth(); },
    signIn: async function (email, password) { var result = await shared().signIn(email, password); if (!result.error) await refreshAuth(); return result; },
    signUp: async function (email, password, metadata) { var result = await shared().signUp(email, password, metadata); if (!result.error && result.data && result.data.session) await refreshAuth(); return result; },
    signOut: async function () { var r = await shared().signOut(); publish({ authenticated: false, userId: null, status: 'signed-out' }); return r; },
    getLocalState: readState,
    saveLocalState: function (snapshot) { return shared().writeLocalState(snapshot); },
    sync: sync,
    pullCloud: function () { return shared().pullCloud(); },
    capabilities: function () { return shared().getCapabilities(); }
  });
  window.METAVERSE_CONNECT_BRIDGE = api;

  window.addEventListener('metaverse:state-changed', function (event) {
    if (!event || !event.detail || typeof event.detail !== 'object') return;
    var snapshot = event.detail.state || event.detail;
    api.saveLocalState(snapshot);
    // Explicit event opt-in avoids unexpectedly uploading every UI interaction.
    if (event.detail.syncToConnect === true) sync(snapshot).catch(function () {});
  });
  window.addEventListener('online', function () {
    if (window.METAVERSE_SHARED_SYNC) shared().retryPending().then(function (r) {
      if (r && r.mode && r.mode !== 'none') publish({ status: r.mode === 'local_fallback' ? 'offline-local' : 'synced', lastSync: new Date().toISOString() });
    }).catch(function (e) { publish({ status: 'sync-error', lastError: String(e && e.message || e) }); });
  });
  window.addEventListener('metaverse:shared-sync-ready', function () { refreshAuth(); });
  publish({ status: window.METAVERSE_SHARED_SYNC ? 'ready' : 'waiting-for-shared-sync' });
  if (window.METAVERSE_SHARED_SYNC) refreshAuth();
})();
