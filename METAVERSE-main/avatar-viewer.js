import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

(function () {
  'use strict';
  const MODEL_URL = 'https://gobkit.com/freebies/human008/RampAgent.glb';
  const canvas = document.getElementById('avatar-canvas');
  const stage = document.getElementById('avatar-stage');
  const fallback = document.getElementById('avatar-fallback');
  const status = document.getElementById('model-status');
  const runtimeStatus = document.getElementById('runtime-status');
  if (!canvas || !stage) return;

  let renderer, scene, camera, controls, mixer, model, activeAction;
  const clock = new THREE.Clock();
  const actions = new Map();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setStatus(message, ready) {
    status.textContent = message;
    status.style.color = ready ? '#83f0bd' : '#ffcf8a';
    runtimeStatus.textContent = ready ? 'AVATAR ONLINE' : 'LOCAL PLAYER HUB';
  }

  function resize() {
    if (!renderer || !camera) return;
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function chooseAction(requested) {
    if (!mixer || !actions.size) return false;
    const wanted = requested.toLowerCase();
    const match = Array.from(actions.keys()).find(name => name.toLowerCase() === wanted)
      || (wanted === 'run' ? Array.from(actions.keys()).find(name => name.toLowerCase() === 'walk') : null)
      || Array.from(actions.keys()).find(name => name.toLowerCase() === 'idle')
      || actions.keys().next().value;
    const next = actions.get(match);
    if (!next) return false;
    if (activeAction && activeAction !== next) activeAction.fadeOut(0.18);
    next.reset().fadeIn(0.18).play();
    activeAction = next;
    document.querySelectorAll('[data-motion]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.motion === wanted));
    });
    return true;
  }

  function fitModel(root) {
    const bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('The avatar model has invalid dimensions.');
    root.position.x -= center.x;
    root.position.z -= center.z;
    root.position.y -= bounds.min.y;
    const radius = Math.max(size.x, size.y, size.z) * 0.5;
    camera.position.set(radius * 2.5, size.y * 0.65, radius * 3.2);
    camera.near = Math.max(0.01, radius / 100);
    camera.far = Math.max(100, radius * 30);
    camera.updateProjectionMatrix();
    controls.target.set(0, size.y * 0.48, 0);
    controls.minDistance = radius * 1.25;
    controls.maxDistance = radius * 8;
    controls.update();
  }

  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    if (mixer && !reduceMotion) mixer.update(delta);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  async function start() {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
      scene.add(new THREE.HemisphereLight(0xbfeaff, 0x17233a, 2.1));
      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(3, 6, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x68dfff, 1.4);
      rim.position.set(-4, 2, -3);
      scene.add(rim);
      controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.enablePan = false;
      controls.minPolarAngle = 0.18;
      controls.maxPolarAngle = Math.PI * 0.48;
      resize();
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);\n      else window.addEventListener('resize', resize);

      const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
      model = gltf.scene;
      model.traverse(node => {
        if (node.isMesh) {
          node.frustumCulled = true;
          if (node.material) {
            node.material.needsUpdate = true;
          }
        }
      });
      scene.add(model);
      fitModel(model);
      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach(clip => actions.set(clip.name, mixer.clipAction(clip)));
        chooseAction('idle');
      }
      fallback.hidden = true;
      canvas.style.opacity = '1';
      setStatus('MODEL READY', true);
      animate();
    } catch (error) {
      console.warn('METAVERSE avatar preview unavailable:', error);
      setStatus('3D PREVIEW UNAVAILABLE', false);
      canvas.style.display = 'none';
      fallback.hidden = false;
      document.getElementById('avatar-description').textContent =
        'The 3D model could not load on this connection or device. The full-body fallback remains visible; retry when online.';
    }
  }

  document.querySelectorAll('[data-motion]').forEach(button => {
    button.addEventListener('click', () => {
      if (!chooseAction(button.dataset.motion)) {
        setStatus('ANIMATION NOT IN THIS MODEL', false);
      }
    });
  });

  document.getElementById('reset-camera')?.addEventListener('click', () => {
    if (model) fitModel(model);
  });
  document.getElementById('focus-avatar')?.addEventListener('click', () => {
    stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });

  const nameInput = document.getElementById('display-name');
  const playerApi = window.METAVERSE_PLAYER_FOUNDATION;
  if (nameInput && playerApi) nameInput.value = playerApi.loadLocal().displayName;
  document.getElementById('profile-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const api = window.METAVERSE_PLAYER_FOUNDATION;
    if (!api) return;
    const result = api.setDisplayName(nameInput.value);
    if (result.ok) {
      nameInput.value = result.state.displayName;
      runtimeStatus.textContent = 'PLAYER SAVED LOCALLY';
    } else {
      nameInput.setCustomValidity('Enter a display name with at least one visible character.');
      nameInput.reportValidity();
      nameInput.addEventListener('input', () => nameInput.setCustomValidity(''), { once: true });
    }
  });

  window.addEventListener('metaverse:player-state-restored', event => {
    if (nameInput && event.detail) nameInput.value = event.detail.displayName;
  });
  window.METAVERSE_AVATAR_VIEWER = Object.freeze({
    modelUrl: MODEL_URL,
    license: 'CC0 1.0',
    setAnimation: chooseAction,
    resetCamera: fitModel
  });

  start();
})();
