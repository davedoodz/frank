import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createBuildingSelection, ELEVATIONS } from "./wireframe-c3-selection.js";

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
let buildingSelection;
let sourceCenter;
// The corner view is a second render of the same scene from a camera that
// never moves, plus a marker for where the live camera stands. One scene,
// two cameras: a picture of the building would be wrong the moment it is
// orbited.
let overview;
let overviewCamera;
let cameraMark;
let markRadius;
// Half the footprint, used to frame the roof plan in the corner and to find
// the corner of the building each level marker leaves from.
let planHalf;
// Everything that belongs to the corner view only is on layer 1, which the
// main camera never renders.
const MARK_LAYER = 1;

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
  sourceCenter = center.toArray();

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
  // The corner view is read as a plan: straight down, no perspective, the
  // roof in the same orientation as the sheet in the pane next to it. With
  // the up vector on -Z, world +X runs right and +Z runs down the frame,
  // which is how the floor plans are drawn.
  planHalf = { x: size.x / 2 * 1.08, z: size.z / 2 * 1.08 };
  overviewCamera.position.set(0, radius * 3, 0);
  overviewCamera.up.set(0, 0, -1);
  overviewCamera.lookAt(0, 0, 0);
  overviewCamera.near = 0.01;
  overviewCamera.far = radius * 8;
  overviewCamera.updateProjectionMatrix();
  // The marker is read as "the eye is over there": it keeps a fixed radius
  // outside the massing whatever the real distance, so in the plan it sits
  // on the side the live camera is looking from.
  markRadius = radius * 0.98;
  cameraMark.scale.setScalar(radius * 0.055);
  resize(host);
}

function resetCamera() {
  buildingSelection?.cancelFlight();
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
  buildingSelection?.cancelFlight();
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
    "Contrôle 3D : cliquer sur une fenêtre pour sélectionner son unité, glisser pour orbiter, molette pour zoomer, flèches pour déplacer la vue",
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

  // The corner view's camera and the marker that stands where the live one
  // is. Both sit on layer 1, so the main render never sees them.
  overviewCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 1000);
  overviewCamera.layers.enable(MARK_LAYER);
  cameraMark = new THREE.Group();
  cameraMark.layers.set(MARK_LAYER);
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x1b1b1b }),
  );
  ball.layers.set(MARK_LAYER);
  cameraMark.add(ball);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 2.1, 24),
    new THREE.MeshBasicMaterial({ color: 0x8ba00f, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }),
  );
  ring.layers.set(MARK_LAYER);
  cameraMark.add(ring);
  scene.add(cameraMark);
  // The line from the target to the marker: the direction the building is
  // being looked from, which is the thing the corner view is for.
  const sight = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
    new THREE.LineBasicMaterial({ color: 0x1b1b1b, transparent: true, opacity: 0.55 }),
  );
  sight.layers.set(MARK_LAYER);
  scene.add(sight);

  renderer.setAnimationLoop((now) => {
    const canvas = renderer.domElement;
    if (!canvas.isConnected || canvas.offsetParent === null) return;
    buildingSelection?.update(now);
    controls.update();
    renderer.render(scene, camera);
    // The marker rides the live camera's direction at a fixed radius, so the
    // corner view says where the building is being looked at from.
    const back = camera.position.clone().sub(controls.target).normalize();
    cameraMark.position.copy(controls.target).add(back.multiplyScalar(markRadius || 1));
    cameraMark.lookAt(controls.target);
    sight.geometry.setFromPoints([controls.target.clone(), cameraMark.position.clone()]);
    renderOverview();
    paintAxes();
    paintNorth();
    paintLevels();
  });
}

// The second pass, into the canvas sitting in the corner of the pane. It
// shares the scene, the lights and the model: only the camera differs — and
// it looks straight down, so the corner view is a roof plan.
function renderOverview() {
  const canvas = document.querySelector("[data-mini3d]");
  if (!canvas || !overviewCamera || !planHalf) return;
  if (!overview || overview.domElement !== canvas) {
    try {
      overview = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    } catch (error) {
      console.error("Corner view unavailable", error);
      canvas.remove();
      return;
    }
    overview.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    overview.outputColorSpace = THREE.SRGBColorSpace;
    overview.toneMapping = THREE.ACESFilmicToneMapping;
  }
  const { width, height } = canvas.getBoundingClientRect();
  if (width < 2 || height < 2) return;
  if (canvas.width !== Math.round(width * overview.getPixelRatio())
      || canvas.height !== Math.round(height * overview.getPixelRatio())) {
    overview.setSize(width, height, false);
    // The footprint is fitted inside the frame without stretching: one
    // scale for both axes, whichever of the two is the tighter.
    const scale = Math.max(planHalf.x / (width / 2), planHalf.z / (height / 2));
    overviewCamera.left = -scale * width / 2;
    overviewCamera.right = scale * width / 2;
    overviewCamera.top = scale * height / 2;
    overviewCamera.bottom = -scale * height / 2;
    overviewCamera.updateProjectionMatrix();
  }
  overview.render(scene, overviewCamera);
}

// The axis gizmo is two dozen numbers, not a third WebGL context: each world
// axis is turned into the camera's frame and drawn as a line in the SVG.
// An axis pointing away from the eye is drawn faint, so the cube reads.
const AXES = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
const axisVec = new THREE.Vector3();
function paintAxes() {
  const svg = document.querySelector("[data-axes]");
  if (!svg || !camera) return;
  const q = camera.quaternion.clone().invert();
  for (const [name, axis] of Object.entries(AXES)) {
    axisVec.copy(axis).applyQuaternion(q);
    const x = axisVec.x * 19, y = -axisVec.y * 19;
    const line = svg.querySelector(`[data-ax="${name}"]`);
    const text = svg.querySelector(`[data-axt="${name}"]`);
    if (!line || !text) continue;
    line.setAttribute("x2", x.toFixed(2));
    line.setAttribute("y2", y.toFixed(2));
    text.setAttribute("x", (x * 1.22).toFixed(2));
    text.setAttribute("y", (y * 1.22).toFixed(2));
    const away = axisVec.z < 0 ? 0.42 : 1;
    line.setAttribute("opacity", away);
    text.setAttribute("opacity", away);
  }
}

// North, drawn as it would lie on the ground: the ring is the unit circle
// of the ground plane projected into the camera's frame, so it flattens to
// a line when the eye drops to the horizon, and the needle swings with the
// building. Which way north runs is the model's -Z, the direction the site
// plan's north arrow points once the export is laid on it.
const NORTH = new THREE.Vector3(0, 0, -1);
const EAST = new THREE.Vector3(1, 0, 0);
const ringVec = new THREE.Vector3();
function paintNorth() {
  const svg = document.querySelector("[data-north3d]");
  if (!svg || !camera) return;
  const q = camera.quaternion.clone().invert();
  const n = NORTH.clone().applyQuaternion(q);
  const e = EAST.clone().applyQuaternion(q);
  const r = 13;
  const points = [];
  for (let i = 0; i < 28; i += 1) {
    const a = (i / 28) * Math.PI * 2;
    ringVec.set(0, 0, 0)
      .addScaledVector(e, Math.cos(a))
      .addScaledVector(n, Math.sin(a));
    points.push(`${(ringVec.x * r).toFixed(2)},${(-ringVec.y * r).toFixed(2)}`);
  }
  svg.querySelector("[data-nring]")?.setAttribute("points", points.join(" "));
  const needle = svg.querySelector("[data-nneedle]");
  const label = svg.querySelector("[data-nlabel]");
  const nx = n.x * r, ny = -n.y * r;
  needle?.setAttribute("x2", nx.toFixed(2));
  needle?.setAttribute("y2", ny.toFixed(2));
  // The letter rides the needle but always sits above it on screen, so it
  // stays upright and legible when the ring is nearly edge-on.
  label?.setAttribute("x", (nx * 1.15).toFixed(2));
  label?.setAttribute("y", (ny * 1.15 - 7).toFixed(2));
}

// Each level is annotated the way a section is: a rule at the top of its
// slab, run out to the edge of the pane, with the level's name at the end.
// The anchor is the corner of the footprint that falls leftmost on screen,
// so the rule leaves the building rather than crossing it.
const corner = new THREE.Vector3();
function paintLevels() {
  const svg = document.querySelector("[data-levels]");
  if (!svg || !camera || !planHalf || !sourceCenter) return;
  const canvas = renderer.domElement;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w < 2 || h < 2) return;
  if (svg.dataset.w !== String(w) || svg.dataset.h !== String(h)) {
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.dataset.w = String(w);
    svg.dataset.h = String(h);
  }
  const selected = Number(document.querySelector("[data-building-model]")?.dataset.selectedLevel) || 0;
  const rows = [];
  for (let level = 1; level <= 8; level += 1) {
    const y = ELEVATIONS[level - 1] - sourceCenter[1];
    // Of the four footprint corners at this height, the one that lands
    // furthest left is where the rule starts.
    let best = null;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        corner.set(sx * planHalf.x, y, sz * planHalf.z).project(camera);
        const px = (corner.x * 0.5 + 0.5) * w, py = (-corner.y * 0.5 + 0.5) * h;
        if (corner.z > 1) continue;
        if (!best || px < best.px) best = { px, py };
      }
    }
    if (!best || best.py < 6 || best.py > h - 6) continue;
    rows.push({ level, ...best });
  }
  svg.innerHTML = rows.map(({ level, px, py }) => {
    // The rule starts at the pane's left margin and runs to the corner it
    // points at. When that corner is off the left of the frame, or almost
    // on it, the rule is given a minimum length so it still reads as a
    // leader rather than a dot.
    const end = Math.max(72, Math.min(px, w - 12));
    return `<g class="${level === selected ? "on" : ""}">
      <line x1="10" y1="${py.toFixed(1)}" x2="${end.toFixed(1)}" y2="${py.toFixed(1)}"></line>
      <text x="10" y="${(py - 5).toFixed(1)}">Niveau ${level}</text>
    </g>`;
  }).join("");
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
        buildingSelection = createBuildingSelection({
          model, camera, controls, canvas: renderer.domElement, sourceCenter,
        });
        buildingSelection.sync();
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
    buildingSelection?.sync();
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
    buildingSelection?.sync();
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
