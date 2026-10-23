/*
 * METAVERSE Shared Identity + Cloud Sync Bridge v1
 *
 * Target backend: METAVERSE Connect Supabase project.
 * Browser-safe: uses only the Supabase publishable key.
 * Never put a service_role/secret key in this file.
 *
 * Intended for both METAVERSE and METAVERSE Connect.
 */
(() => {
  'use strict';

  const CONFIG = Object.freeze({
    supabaseUrl: 'https://zuibhtpvonnnqwuposuj.supabase.co',
    publishableKey: 'sb_publishable_x7MBDfhHgqE_JVL3BZp-zA_zcqbrE-M',
    supabaseCdn: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm',
    schemaVersion: 1,
    localStateKey: 'metaverse:shared-sync:v1:local',
    pendingKey: 'metaverse:shared-sync:v1:pending',
    revisionKey: 'metaverse:shared-sync:v1:revision',
    clientIdKey: 'metaverse:shared-sync:v1:client-id',
    maxStateBytes: 500000,
  });

  const hasStorage = typeof window !== 'undefined' && !!window.localStorage;

  function readLocal(key, fallback) {
    if (!hasStorage) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function writeLocal(key, value) {
    if (!hasStorage) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function removeLocal(key) {
    if (!hasStorage) return;
    try { window.localStorage.removeItem(key); } catch (_) {}
  }

  function uuid() {
    try {
      if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
      }
    } catch (_) {}
    return 'mv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  function detectCapabilities() {
    var ua = typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : '';
    var platform = typeof navigator !== 'undefined' && navigator.platform ? navigator.platform : '';
    var width = typeof window !== 'undefined' ? (window.innerWidth || 0) : 0;
    var touch = typeof navigator !== 'undefined' ? (navigator.maxTouchPoints || 0) : 0;
    var hasFetch = typeof window !== 'undefined' && typeof window.fetch === 'function';
    var hasXHR = typeof XMLHttpRequest !== 'undefined';
    var hasPromise = typeof Promise !== 'undefined';
    var hasWebSocket = typeof WebSocket !== 'undefined';
    var hasLocalStorage = hasStorage;
    var hasIndexedDB = typeof indexedDB !== 'undefined';
    var hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
    var hasBroadcastChannel = typeof BroadcastChannel !== 'undefined';
    var hasCrypto = typeof globalThis !== 'undefined' && !!globalThis.crypto;
    var hasModules = false;
    try { hasModules = typeof HTMLScriptElement !== 'undefined' && ('noModule' in HTMLScriptElement.prototype); } catch (_) {}

    var tier = 'static';
    if (hasFetch && hasXHR && hasPromise && hasWebSocket && hasLocalStorage && hasModules) tier = 'full';
    else if (hasXHR && hasPromise && hasLocalStorage) tier = 'reduced';
    else if (hasXHR && hasLocalStorage) tier = 'lite';

    var deviceClass = touch > 0 && width < 800 ? 'phone' : touch > 0 ? 'tablet' : 'desktop';
    if (/Quest|VR|Oculus|Pico|Vive/i.test(ua)) deviceClass = 'vr';

    var browserFamily = /CriOS/i.test(ua) ? 'Chrome iOS' :
      /FxiOS/i.test(ua) ? 'Firefox iOS' :
      /EdgiOS/i.test(ua) ? 'Edge iOS' :
      /Edg\//i.test(ua) ? 'Edge' :
      /Chrome\//i.test(ua) ? 'Chrome' :
      /Firefox\//i.test(ua) ? 'Firefox' :
      /Safari\//i.test(ua) ? 'Safari' :
      /OPR\//i.test(ua) ? 'Opera' : 'Other';

    var osFamily = /iPhone|iPad|iPod/i.test(ua) ? 'iOS/iPadOS' :
      /Android/i.test(ua) ? 'Android' :
      /Mac OS X/i.test(ua) ? 'macOS' :
      /Windows/i.test(ua) ? 'Windows' :
      /Linux/i.test(ua) ? 'Linux' : platform || 'Other';

    return {
      tier: tier,
      deviceClass: deviceClass,
      browserFamily: browserFamily,
      osFamily: osFamily,
      capabilities: {
        fetch: hasFetch,
        xhr: hasXHR,
        promise: hasPromise,
        websocket: hasWebSocket,
        localStorage: hasLocalStorage,
        indexedDB: hasIndexedDB,
        serviceWorker: hasServiceWorker,
        broadcastChannel: hasBroadcastChannel,
        crypto: hasCrypto,
        modules: hasModules,
        touch: touch > 0,
        viewportWidth: width
      }
    };
  }

  function getClientId() {
    const existing = hasStorage ? window.localStorage.getItem(CONFIG.clientIdKey) : null;
    if (existing) return existing;
    const id = uuid();
    if (hasStorage) {
      try { window.localStorage.setItem(CONFIG.clientIdKey, id); } catch (_) {}
    }
    return id;
  }

  function clone(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function byteLength(value) {
    var raw = JSON.stringify(value);
    try {
      if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(raw).byteLength;
    } catch (_) {}
    return raw.length;
  }

  function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function sanitizeState(input) {
    const source = isObject(input) ? input : {};
    const user = isObject(source.user) ? source.user : {};
    const progression = isObject(source.progression) ? source.progression : {};
    const inventory = isObject(source.inventory) ? source.inventory : {};
    const avatar = isObject(source.avatar) ? source.avatar : {};
    const achievements = Array.isArray(source.achievements) ? source.achievements : [];
    const settings = isObject(source.settings) ? source.settings : {};
    const world = isObject(source.world) ? source.world : {};
    const social = isObject(source.social) ? source.social : {};
    const customization = isObject(source.customization) ? source.customization : {};
    const accessibility = isObject(source.accessibility) ? source.accessibility : {};
    const notifications = isObject(source.notifications) ? source.notifications : {};
    const privacy = isObject(source.privacy) ? source.privacy : {};

    const cleanSettings = {
      theme: ['system','dark','light'].includes(settings.theme) ? settings.theme : 'system',
      density: ['compact','comfortable'].includes(settings.density) ? settings.density : 'compact',
      language: typeof settings.language === 'string' ? settings.language.slice(0,16) : 'en',
      sound: settings.sound !== false,
      music: settings.music !== false,
      haptics: settings.haptics !== false,
      autoSync: settings.autoSync !== false,
      offlineMode: settings.offlineMode !== false,
      startupMode: ['last','home','dashboard'].includes(settings.startupMode) ? settings.startupMode : 'last',
      dataSaver: !!settings.dataSaver,
    };
    const cleanCustomization = {
      accent: typeof customization.accent === 'string' ? customization.accent.slice(0,32) : 'default',
      dashboardLayout: typeof customization.dashboardLayout === 'string' ? customization.dashboardLayout.slice(0,48) : 'default',
      nameplate: typeof customization.nameplate === 'string' ? customization.nameplate.slice(0,48) : 'default',
      background: typeof customization.background === 'string' ? customization.background.slice(0,96) : 'default',
      quickActions: Array.isArray(customization.quickActions) ? customization.quickActions.filter(x=>typeof x==='string').slice(0,16) : [],
      hiddenCards: Array.isArray(customization.hiddenCards) ? customization.hiddenCards.filter(x=>typeof x==='string').slice(0,24) : [],
    };
    const cleanAccessibility = {
      reducedMotion: !!accessibility.reducedMotion,
      highContrast: !!accessibility.highContrast,
      largeText: !!accessibility.largeText,
      captions: accessibility.captions !== false,
    };
    const cleanNotifications = {
      enabled: notifications.enabled !== false,
      grouped: notifications.grouped !== false,
      sounds: notifications.sounds !== false,
      mentions: notifications.mentions !== false,
      connectionRequests: notifications.connectionRequests !== false,
      studioActivity: notifications.studioActivity !== false,
    };
    const cleanPrivacy = {
      profileVisibility: ['connections','private'].includes(privacy.profileVisibility) ? privacy.profileVisibility : 'connections',
      presenceVisibility: ['connections','private','offline'].includes(privacy.presenceVisibility) ? privacy.presenceVisibility : 'connections',
      activitySharing: !!privacy.activitySharing,
      crossAppContinuations: privacy.crossAppContinuations !== false,
    };

    // Authorization-sensitive fields such as role are deliberately excluded.
    // Server-side roles/permissions must never be taken from client state.
    const cleanUser = {
      username: typeof user.username === 'string' ? user.username.slice(0, 64) : '',
      displayName: typeof user.displayName === 'string' ? user.displayName.slice(0, 80) : '',
      avatar: typeof user.avatar === 'string' ? user.avatar.slice(0, 64) : '',
      gamesPlayed: Number.isFinite(Number(user.gamesPlayed)) ? Math.max(0, Number(user.gamesPlayed)) : 0,
      itemsBought: Number.isFinite(Number(user.itemsBought)) ? Math.max(0, Number(user.itemsBought)) : 0,
      totalEarned: Number.isFinite(Number(user.totalEarned)) ? Math.max(0, Number(user.totalEarned)) : 0,
      lastDailyClaim: Number.isFinite(Number(user.lastDailyClaim)) ? Math.max(0, Number(user.lastDailyClaim)) : 0,
    };

    const cleanProgression = {
      coins: Number.isFinite(Number(progression.coins)) ? Math.max(0, Number(progression.coins)) : 0,
      xp: Number.isFinite(Number(progression.xp)) ? Math.max(0, Number(progression.xp)) : 0,
      level: Number.isFinite(Number(progression.level)) ? Math.max(1, Number(progression.level)) : 1,
      lastPlayedGame: typeof progression.lastPlayedGame === 'string' ? progression.lastPlayedGame.slice(0, 128) : null,
    };

    const cleanInventory = Array.isArray(inventory.items)
      ? inventory.items.filter(x => typeof x === 'string').slice(0, 2000)
      : [];

    const cleanAvatar = {
      equipped: isObject(avatar.equipped) ? {
        hat: typeof avatar.equipped.hat === 'string' ? avatar.equipped.hat.slice(0, 128) : null,
        acc: typeof avatar.equipped.acc === 'string' ? avatar.equipped.acc.slice(0, 128) : null,
        skin: typeof avatar.equipped.skin === 'string' ? avatar.equipped.skin.slice(0, 128) : 'skin_bot',
        pet: typeof avatar.equipped.pet === 'string' ? avatar.equipped.pet.slice(0, 128) : null,
      } : { hat: null, acc: null, skin: 'skin_bot', pet: null },
    };

    const cleanAchievements = achievements
      .filter(x => isObject(x) && typeof x.id === 'string')
      .slice(0, 500)
      .map(x => ({ id: x.id.slice(0, 128), done: !!x.done }));

    return {
      schemaVersion: CONFIG.schemaVersion,
      user: cleanUser,
      progression: cleanProgression,
      inventory: { items: cleanInventory },
      avatar: cleanAvatar,
      achievements: cleanAchievements,
      settings: cleanSettings,
      customization: cleanCustomization,
      accessibility: cleanAccessibility,
      notifications: cleanNotifications,
      privacy: cleanPrivacy,
      world: clone(world),
      social: clone(social),
      meta: {
        clientId: getClientId(),
        savedAt: new Date().toISOString(),
      },
    };
  }

  function makeDomainEnvelope(state) {
    const clean = sanitizeState(state);
    const now = Date.now();
    return {
      schemaVersion: CONFIG.schemaVersion,
      domains: {
        user: { value: clean.user, updatedAt: now },
        progression: { value: clean.progression, updatedAt: now },
        inventory: { value: clean.inventory, updatedAt: now },
        avatar: { value: clean.avatar, updatedAt: now },
        achievements: { value: clean.achievements, updatedAt: now },
        settings: { value: clean.settings, updatedAt: now },
        world: { value: clean.world, updatedAt: now },
        social: { value: clean.social, updatedAt: now },
        customization: { value: clean.customization, updatedAt: now },
        accessibility: { value: clean.accessibility, updatedAt: now },
        notifications: { value: clean.notifications, updatedAt: now },
        privacy: { value: clean.privacy, updatedAt: now },
      },
      meta: clean.meta,
    };
  }

  function toLegacyState(cloudState, fallback) {
    const source = isObject(cloudState) ? cloudState : {};
    const domains = isObject(source.domains) ? source.domains : source;
    const read = (name, fallbackValue) =>
      isObject(domains[name]) && domains[name].value !== undefined ? domains[name].value : fallbackValue;
    const base = clone(fallback || {});
    const user = read('user', base.user || {});
    const progression = read('progression', {});
    const inventory = read('inventory', base.inventory || { items: [] });
    const avatar = read('avatar', base.avatar || { equipped: {} });
    const achievements = read('achievements', base.achievements || []);
    return {
      ...base,
      user: { ...(base.user || {}), ...user, coins: progression.coins, xp: progression.xp },
      inventory: Array.isArray(inventory.items) ? inventory.items : (base.inventory || []),
      equipped: avatar.equipped || base.equipped || {},
      achievements: Array.isArray(achievements) ? achievements : (base.achievements || []),
    };
  }

  async function loadSupabase() {
    if (globalThis.supabase?.createClient) return globalThis.supabase;
    const mod = await import(CONFIG.supabaseCdn);
    return mod;
  }

  const readyPromise = loadSupabase().then((mod) => {
    const createClient = mod.createClient || globalThis.supabase?.createClient;
    if (!createClient) throw new Error('SUPABASE_CLIENT_UNAVAILABLE');
    return createClient(CONFIG.supabaseUrl, CONFIG.publishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  });

  const api = {
    config: CONFIG,
    clientId: getClientId(),
    ready: () => readyPromise,

    async getSession() {
      const supabase = await readyPromise;
      return supabase.auth.getSession();
    },

    async getUser() {
      const supabase = await readyPromise;
      return supabase.auth.getUser();
    },

    async signIn(email, password) {
      const supabase = await readyPromise;
      return supabase.auth.signInWithPassword({ email, password });
    },

    async signUp(email, password, metadata = {}) {
      const supabase = await readyPromise;
      return supabase.auth.signUp({ email, password, options: { data: metadata } });
    },

    async signOut({ scope = 'local' } = {}) {
      const supabase = await readyPromise;
      return supabase.auth.signOut({ scope });
    },

    onAuthStateChange(handler) {
      let subscription = null;
      readyPromise.then(supabase => {
        const result = supabase.auth.onAuthStateChange(handler);
        subscription = result?.data?.subscription || null;
      }).catch(() => {});
      return () => subscription?.unsubscribe?.();
    },

    readLocalState(fallback = {}) {
      return readLocal(CONFIG.localStateKey, fallback);
    },

    writeLocalState(state) {
      const clean = sanitizeState(state);
      writeLocal(CONFIG.localStateKey, clean);
      return clean;
    },

    readLocalRevision() {
      return Number(readLocal(CONFIG.revisionKey, 0)) || 0;
    },

    async syncProfileFromLegacy(userState = {}) {
      const supabase = await readyPromise;
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const uid = authData?.user?.id;
      if (!uid) return { data: null };

      const { data: current, error: readError } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('id', uid)
        .maybeSingle();
      if (readError) throw readError;

      const patch = {};
      if (!current?.username && typeof userState.username === 'string' && userState.username.trim()) {
        patch.username = userState.username.trim().slice(0, 32);
      }
      if (!current?.display_name && typeof userState.displayName === 'string' && userState.displayName.trim()) {
        patch.display_name = userState.displayName.trim().slice(0, 80);
      }
      if (!current?.avatar_url && typeof userState.avatarUrl === 'string' && /^https?:\/\//i.test(userState.avatarUrl)) {
        patch.avatar_url = userState.avatarUrl.slice(0, 500);
      }

      if (!Object.keys(patch).length) return { data: current, changed: false };
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', uid)
        .select('username, display_name, avatar_url')
        .single();
      if (error) throw error;
      return { data, changed: true };
    },

    async pullCloud() {
      const supabase = await readyPromise;
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const uid = userData?.user?.id;
      if (!uid) return { data: null, revision: 0, updatedAt: null };

      const { data, error } = await supabase
        .from('player_cloud_state')
        .select('schema_version, revision, state, client_id, client_updated_at, updated_at')
        .eq('user_id', uid)
        .maybeSingle();
      if (error) throw error;

      return {
        data: data?.state || null,
        revision: Number(data?.revision || 0),
        updatedAt: data?.updated_at || null,
        clientUpdatedAt: data?.client_updated_at || null,
      };
    },

    async pushCloud(state, expectedRevision = null) {
      const supabase = await readyPromise;
      const clean = makeDomainEnvelope(state);
      if (byteLength(clean) > CONFIG.maxStateBytes) throw new Error('SYNC_STATE_TOO_LARGE');

      const revision = expectedRevision == null ? this.readLocalRevision() : Number(expectedRevision);
      const { data, error } = await supabase.rpc('write_player_cloud_state', {
        p_state: clean,
        p_client_id: this.clientId,
        p_expected_revision: Number.isFinite(revision) ? revision : null,
      });
      if (error) {
        if (String(error.message || '').includes('SYNC_CONFLICT')) {
          const conflict = new Error('SYNC_CONFLICT');
          conflict.code = 'SYNC_CONFLICT';
          throw conflict;
        }
        throw error;
      }

      const row = Array.isArray(data) ? data[0] : data;
      const nextRevision = Number(row?.revision || 0);
      writeLocal(CONFIG.revisionKey, nextRevision);
      writeLocal(CONFIG.pendingKey, null);
      writeLocalState(clean);
      return { state: clean, revision: nextRevision, updatedAt: row?.updated_at || null };
    },

    async sync(state, { fallbackState = {}, onApply = null } = {}) {
      const localState = sanitizeState(state);
      this.writeLocalState(localState);

      const cloud = await this.pullCloud();
      if (!cloud.data) {
        const pushed = await this.pushCloud(localState, 0);
        if (onApply) onApply(pushed.state, pushed);
        return { mode: 'initial_push', ...pushed };
      }

      const cloudState = cloud.data;
      const merged = mergeDomainStates(localState, cloudState);
      writeLocal(CONFIG.revisionKey, cloud.revision);

      // Push merged state against the revision we just observed. This prevents
      // overwriting a newer device change without detecting it.
      try {
        const pushed = await this.pushCloud(merged, cloud.revision);
        if (onApply) onApply(pushed.state, pushed);
        return { mode: 'merged', ...pushed };
      } catch (error) {
        if (error?.code === 'SYNC_CONFLICT') {
          const latest = await this.pullCloud();
          const secondMerge = mergeDomainStates(merged, latest.data || {});
          const pushed = await this.pushCloud(secondMerge, latest.revision);
          if (onApply) onApply(pushed.state, pushed);
          return { mode: 'reconciled', ...pushed };
        }
        // Preserve the locally cached state for offline/retry behavior.
        writeLocal(CONFIG.pendingKey, localState);
        if (onApply) onApply(localState, { offline: true, error });
        return { mode: 'local_fallback', state: localState, revision: cloud.revision, error };
      }
    },

    async savePortablePreferences(patch = {}) {
      const cloud = await this.pullCloud();
      const envelope = cloud?.data || {};
      const domains = isObject(envelope.domains) ? envelope.domains : {};
      const read = (name, fallback) => isObject(domains[name]) && domains[name].value !== undefined ? domains[name].value : fallback;
      const current = {
        user: read('user', {}),
        progression: read('progression', {}),
        inventory: read('inventory', { items: [] }),
        avatar: read('avatar', { equipped: {} }),
        achievements: read('achievements', []),
        settings: { ...read('settings', {}), ...(isObject(patch.settings) ? patch.settings : {}) },
        customization: { ...read('customization', {}), ...(isObject(patch.customization) ? patch.customization : {}) },
        accessibility: { ...read('accessibility', {}), ...(isObject(patch.accessibility) ? patch.accessibility : {}) },
        notifications: { ...read('notifications', {}), ...(isObject(patch.notifications) ? patch.notifications : {}) },
        privacy: { ...read('privacy', {}), ...(isObject(patch.privacy) ? patch.privacy : {}) },
        world: read('world', {}),
        social: read('social', {}),
      };
      return this.sync(current, { fallbackState: current });
    },

    async retryPending({ fallbackState = {}, onApply = null } = {}) {
      const pending = readLocal(CONFIG.pendingKey, null);
      if (!pending) return { mode: 'none' };
      const result = await this.sync(pending, { fallbackState, onApply });
      if (result.mode !== 'local_fallback') removeLocal(CONFIG.pendingKey);
      return result;
    },

    getCapabilities() {
      return detectCapabilities();
    },

    async registerDevice({ deviceName = null, platform = null, app = 'connect' } = {}) {
      const supabase = await readyPromise;
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const userId = userData?.user?.id;
      if (!userId) return { data: null };
      const caps = detectCapabilities();
      const payload = {
        user_id: userId,
        device_id: this.clientId,
        device_name: deviceName || (typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent.slice(0, 80) : 'Device'),
        platform: platform || (typeof navigator !== 'undefined' ? (navigator.platform || 'web') : 'web'),
        app_last_seen: app,
        browser_family: caps.browserFamily,
        os_family: caps.osFamily,
        device_class: caps.deviceClass,
        compatibility_tier: caps.tier,
        capabilities: caps.capabilities,
        last_error: null,
        last_seen_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('device_registrations')
        .upsert(payload, { onConflict: 'user_id,device_id' })
        .select()
        .single();
      if (error) throw error;
      return { data, capabilities: caps };
    },

    async listDevices() {
      const supabase = await readyPromise;
      return supabase
        .from('device_registrations')
        .select('device_id,device_name,platform,app_last_seen,browser_family,os_family,device_class,compatibility_tier,capabilities,last_error,last_seen_at,created_at')
        .order('last_seen_at', { ascending: false });
    },

    async createContinuation({ title, sourceApp = 'metaverse', targetApp = 'connect', context = {} }) {
      const supabase = await readyPromise;
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const ownerId = userData?.user?.id;
      if (!ownerId) throw new Error('AUTH_REQUIRED');
      const compactContext = isObject(context) ? clone(context) : {};
      if (compactContext.kind === 'ai_chat') compactContext.kind = 'ai_chat';
      const { data, error } = await supabase
        .from('cross_app_continuations')
        .insert({ owner_id: ownerId, title: String(title || 'Untitled handoff').slice(0, 160), source_app: sourceApp, target_app: targetApp, context: compactContext })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async listContinuations() {
      const supabase = await readyPromise;
      return supabase
        .from('cross_app_continuations')
        .select('id,title,source_app,target_app,status,context,created_at,updated_at')
        .order('updated_at', { ascending: false });
    },

    async appendContinuationEvent(continuationId, { app = 'connect', eventType, payload = {} } = {}) {
      const supabase = await readyPromise;
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const actorId = userData?.user?.id;
      if (!actorId) throw new Error('AUTH_REQUIRED');
      return supabase.from('cross_app_continuation_events').insert({
        continuation_id: continuationId, actor_id: actorId, app, event_type: eventType, payload
      });
    },

    async updateContinuation(id, patch = {}) {
      const supabase = await readyPromise;
      const allowed = {};
      if (patch.title != null) allowed.title = String(patch.title).slice(0, 160);
      if (patch.status != null) allowed.status = patch.status;
      if (patch.context != null && isObject(patch.context)) allowed.context = patch.context;
      if (!Object.keys(allowed).length) return { data: null, error: null };
      return supabase.from('cross_app_continuations')
        .update(allowed)
        .eq('id', id)
        .select('id,title,source_app,target_app,status,context,created_at,updated_at')
        .single();
    },

    async preparePrivateRealtime() {
      const supabase = await readyPromise;
      if (!supabase.realtime || typeof supabase.realtime.setAuth !== 'function') return supabase;
      await supabase.realtime.setAuth();
      return supabase;
    },

    async broadcast(topic, event, payload = {}, { private: isPrivate = true, ack = true, self = true } = {}) {
      const supabase = await this.preparePrivateRealtime();
      const channel = supabase.channel(topic, {
        config: { private: !!isPrivate, broadcast: { ack: !!ack, self: !!self } }
      });
      const result = await new Promise((resolve, reject) => {
        channel.subscribe(async status => {
          if (status === 'SUBSCRIBED') {
            try { resolve(await channel.send({ type: 'broadcast', event, payload })); }
            catch (e) { reject(e); }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            reject(new Error('REALTIME_' + status));
          }
        });
      });
      await supabase.removeChannel(channel);
      return result;
    },

    async subscribePresence(topic, { onSync = null, onJoin = null, onLeave = null, private: isPrivate = true, key = this.clientId } = {}) {
      const supabase = await this.preparePrivateRealtime();
      const channel = supabase.channel(topic, {
        config: { private: !!isPrivate, presence: { key } }
      });
      if (onSync) channel.on('presence', { event: 'sync' }, () => onSync(channel.presenceState()));
      if (onJoin) channel.on('presence', { event: 'join' }, payload => onJoin(payload, channel.presenceState()));
      if (onLeave) channel.on('presence', { event: 'leave' }, payload => onLeave(payload, channel.presenceState()));
      const statusPromise = new Promise((resolve, reject) => {
        channel.subscribe(status => {
          if (status === 'SUBSCRIBED') resolve(status);
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') reject(new Error('REALTIME_' + status));
        });
      });
      await statusPromise;
      return {
        channel: channel,
        track: state => channel.track(state),
        untrack: () => channel.untrack(),
        close: () => supabase.removeChannel(channel)
      };
    },

    async subscribeUserPresence(userId, handlers = {}) {
      return this.subscribePresence('connect:user:' + userId, {
        ...handlers,
        key: String(userId) + ':' + this.clientId
      });
    },

    async subscribeConversationRealtime(conversationId, handlers = {}) {
      return this.subscribePresence('connect:conversation:' + conversationId, handlers);
    },

    async subscribeStudioRealtime(spaceId, handlers = {}) {
      return this.subscribePresence('connect:studio:' + spaceId, handlers);
    },

    async subscribeNotifications(handler) {
      return readyPromise.then(async supabase => {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id;
        if (!uid) return () => {};
        const channel = supabase
          .channel('metaverse-notifications-' + uid)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + uid }, payload => handler?.(payload.new, payload))
          .subscribe();
        return () => { supabase.removeChannel(channel); };
      });
    },

    async subscribeConnections(handler) {
      return readyPromise.then(async supabase => {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id;
        if (!uid) return () => {};
        const channel = supabase
          .channel('metaverse-connections-' + uid)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, payload => handler?.(payload))
          .subscribe();
        return () => { supabase.removeChannel(channel); };
      });
    },

    async subscribeConnectionRequests(handler) {
      return readyPromise.then(async supabase => {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id;
        if (!uid) return () => {};
        const channel = supabase
          .channel('metaverse-requests-' + uid)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'connection_requests' }, payload => handler?.(payload))
          .subscribe();
        return () => { supabase.removeChannel(channel); };
      });
    },

    subscribeContinuations(handler) {
      return readyPromise.then(async supabase => {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id;
        if (!uid) return () => {};
        const channel = supabase
          .channel(`metaverse-continuations-${uid}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'cross_app_continuations', filter: `owner_id=eq.${uid}` }, payload => handler?.(payload))
          .subscribe();
        return () => { supabase.removeChannel(channel); };
      });
    },

    subscribeProfile(handler) {
      return readyPromise.then(async supabase => {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id;
        if (!uid) return () => {};
        const channel = supabase
          .channel(`metaverse-profile-${uid}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` }, payload => {
            if (payload?.new) handler?.(payload.new, payload);
          })
          .subscribe();
        return () => { supabase.removeChannel(channel); };
      });
    },

    subscribeDevices(handler) {
      return readyPromise.then(async supabase => {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id;
        if (!uid) return () => {};
        const channel = supabase
          .channel(`metaverse-devices-${uid}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'device_registrations', filter: `user_id=eq.${uid}` }, payload => handler?.(payload))
          .subscribe();
        return () => { supabase.removeChannel(channel); };
      });
    },

    subscribeCloud(handler) {
      return readyPromise.then(async supabase => {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id;
        if (!uid) return () => {};
        const channel = supabase
          .channel(`metaverse-cloud-state-${uid}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'player_cloud_state',
            filter: `user_id=eq.${uid}`,
          }, payload => {
            if (payload?.new?.client_id === this.clientId) return;
            handler?.({
              state: payload?.new?.state || null,
              revision: Number(payload?.new?.revision || 0),
              updatedAt: payload?.new?.updated_at || null,
              clientUpdatedAt: payload?.new?.client_updated_at || null,
            });
          })
          .subscribe();
        return () => { supabase.removeChannel(channel); };
      });
    },

    createSnapshotFromLegacy({ userData, inventory, equipped, achievements, settings, world, social, customization, accessibility, notifications, privacy, lastPlayedGame }) {
      return sanitizeState({
        user: userData || {},
        progression: {
          coins: userData?.coins || 0,
          xp: userData?.xp || 0,
          level: userData?.level || 1,
          lastPlayedGame: lastPlayedGame || null,
        },
        inventory: { items: Array.isArray(inventory) ? inventory : [] },
        avatar: { equipped: equipped || {} },
        achievements: Array.isArray(achievements) ? achievements : [],
        settings: settings || {},
        customization: customization || {},
        accessibility: accessibility || {},
        notifications: notifications || {},
        privacy: privacy || {},
        world: world || {},
        social: social || {},
      });
    },

    applyCloudToLegacy(cloudState, legacyState) {
      return toLegacyState(cloudState, legacyState);
    },
  };

  function mergeDomainStates(localState, cloudState) {
    const local = isObject(localState) ? localState : {};
    const cloud = isObject(cloudState) ? cloudState : {};
    const ld = isObject(local.domains) ? local.domains : {};
    const cd = isObject(cloud.domains) ? cloud.domains : {};
    const domains = {};
    const names = new Set([...Object.keys(ld), ...Object.keys(cd)]);
    for (const name of names) {
      const a = isObject(ld[name]) ? ld[name] : null;
      const b = isObject(cd[name]) ? cd[name] : null;
      if (!a) domains[name] = clone(b);
      else if (!b) domains[name] = clone(a);
      else domains[name] = (Number(a.updatedAt || 0) >= Number(b.updatedAt || 0)) ? clone(a) : clone(b);
    }
    return {
      schemaVersion: CONFIG.schemaVersion,
      domains,
      meta: {
        clientId: getClientId(),
        savedAt: new Date().toISOString(),
      },
    };
  }

  globalThis.METAVERSE_SHARED_SYNC = Object.freeze(api);
  globalThis.dispatchEvent?.(new CustomEvent('metaverse:shared-sync-ready', { detail: { version: '1.0.0' } }));
})();
