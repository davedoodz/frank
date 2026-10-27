import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MODEL_URL = "assets/building.glb";

let renderer;
let scene;
let camera;
let controls;
let resizeObserver;
let model;
let modelPromise;
let homePosition;
let homeTarget;
let lastZoom = null;

function setStatus(host, state, message) {
  host.dataset.state = state;
  host.setAttribute("aria-busy", state === "loading" ? "true" : "false");
  const status = host.querySelector("[data-model-status]");
  if (status) status.textContent = message;
}

function resize(host) {
  if (!renderer || !camera || !host.isConnected) return;
  const { width, height } = host.getBoundingClientRect();
  if (width < 2 || height < 2) return;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function fitModel(host) {
  if (!model || !camera || !controls) return;

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // The exported model is close to the origin but not centred. Recentring at
  // runtime keeps the source GLB untouched and gives OrbitControls a stable
  // target regardless of how SketchUp located the project.
  model.position.sub(center);

  const radius = Math.max(size.length() / 2, 1);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const distance = (radius / Math.sin(fov / 2)) * 1.05;
  const direction = new THREE.Vector3(1.05, 0.48, 1.25).normalize();

  camera.near = Math.max(distance / 1000, 0.01);
  camera.far = distance * 20;
  camera.position.copy(direction.multiplyScalar(distance));
  camera.updateProjectionMatrix();

  controls.target.set(0, 0, 0);
  controls.minDistance = radius * 0.35;
  controls.maxDistance = radius * 8;
  controls.update();

  homePosition = camera.position.clone();
  homeTarget = controls.target.clone();
  resize(host);
}

function resetCamera() {
  if (!homePosition || !homeTarget || !camera || !controls) return;
  camera.position.copy(homePosition);
  controls.target.copy(homeTarget);
  controls.update();
}

// The slider on the edge of the pane needs one number it can write and read
// back. Distance between the two limits OrbitControls already carries, on a
// log scale so each step of the slider feels the same, mapped 0 far to
// 100 near.
// Until fitModel has run, OrbitControls still carries its defaults, 0 and
// Infinity, which have no logarithm. Both ends have to be real distances
// before the slider means anything.
function limits() {
  if (!camera || !controls) return null;
  const { minDistance: lo, maxDistance: hi } = controls;
  return lo > 0 && Number.isFinite(hi) && hi > lo ? { lo, hi } : null;
}

function readZoom() {
  const l = limits();
  if (!l) return null;
  const d = camera.position.distanceTo(controls.target);
  const t = (Math.log(d) - Math.log(l.lo)) / (Math.log(l.hi) - Math.log(l.lo));
  if (!Number.isFinite(t)) return null;
  return Math.round((1 - Math.min(1, Math.max(0, t))) * 100);
}

function writeZoom(percent) {
  const l = limits();
  if (!l || !Number.isFinite(percent)) return;
  const t = 1 - Math.min(100, Math.max(0, percent)) / 100;
  const d = Math.exp(Math.log(l.lo) + t * (Math.log(l.hi) - Math.log(l.lo)));
  const direction = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).add(direction.multiplyScalar(d));
  controls.update();
}

window.fitteModel = { readZoom, writeZoom, reset: resetCamera };

function createRenderer() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf1f3f4);

  camera = new THREE.PerspectiveCamera(32, 1, 0.01, 1000);
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.domElement.className = "model3d-canvas";
  renderer.domElement.setAttribute(
    "aria-label",
    "Contrôle 3D : glisser pour orbiter, molette pour zoomer, flèches pour déplacer la vue",
  );
  renderer.domElement.tabIndex = 0;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8c9094, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(18, 28, 22);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdde8f2, 1.4);
  fill.position.set(-20, 10, -16);
  scene.add(fill);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.screenSpacePanning = true;
  controls.zoomToCursor = true;
  controls.listenToKeyEvents(renderer.domElement);

  // Orbiting and the wheel change the same number the slider shows, so the
  // viewer announces it. Only whole percents are sent: damping fires this
  // listener every frame while the camera settles.
  controls.addEventListener("change", () => {
    const percent = readZoom();
    if (percent === null || percent === lastZoom) return;
    lastZoom = percent;
    window.dispatchEvent(new CustomEvent("fitte:model-zoom", { detail: percent }));
  });

  renderer.setAnimationLoop(() => {
    const canvas = renderer.domElement;
    if (!canvas.isConnected || canvas.offsetParent === null) return;
    controls.update();
    renderer.render(scene, camera);
  });
}

function loadModel(host) {
  if (modelPromise) return modelPromise;

  const loader = new GLTFLoader();
  modelPromise = new Promise((resolve, reject) => {
    loader.load(
      MODEL_URL,
      (gltf) => {
        model = gltf.scene;
        model.traverse((object) => {
          if (!object.isMesh) return;
          object.castShadow = false;
          object.receiveShadow = false;
        });
        scene.add(model);
        fitModel(host);
        resolve(model);
      },
      (event) => {
        if (!event.total) return;
        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        setStatus(host, "loading", `Chargement de la maquette… ${percent} %`);
      },
      reject,
    );
  });

  return modelPromise;
}

async function mountBuildingViewer() {
  const host = document.querySelector("[data-building-model]");
  if (!host) return;

  if (!renderer) {
    try {
      createRenderer();
    } catch (error) {
      console.error("WebGL unavailable for the building model", error);
      setStatus(host, "error", "Impossible de charger la maquette 3D.");
      return;
    }
  }
  if (renderer.domElement.parentElement !== host) host.prepend(renderer.domElement);

  resizeObserver?.disconnect();
  resizeObserver = new ResizeObserver(() => resize(host));
  resizeObserver.observe(host);
  resize(host);

  const reset = host.querySelector("[data-model-reset]");
  if (reset) reset.onclick = (event) => {
    event.stopPropagation();
    resetCamera();
  };

  if (model) {
    setStatus(host, "ready", "");
    return;
  }

  setStatus(host, "loading", "Chargement de la maquette…");
  try {
    await loadModel(host);
    // A render may have replaced the host while the 58 MB GLB was decoding.
    // Mount again so the persistent canvas follows the current pane.
    const currentHost = document.querySelector("[data-building-model]");
    if (currentHost && renderer.domElement.parentElement !== currentHost) {
      currentHost.prepend(renderer.domElement);
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(() => resize(currentHost));
      resizeObserver.observe(currentHost);
      resize(currentHost);
    }
    if (currentHost) setStatus(currentHost, "ready", "");
  } catch (error) {
    console.error("Building model failed to load", error);
    const currentHost = document.querySelector("[data-building-model]") || host;
    setStatus(currentHost, "error", "Impossible de charger la maquette 3D.");
  }
}

window.addEventListener("fitte:render", () => queueMicrotask(mountBuildingViewer));
window.addEventListener("resize", () => {
  const host = document.querySelector("[data-building-model]");
  if (host) resize(host);
});

mountBuildingViewer();
