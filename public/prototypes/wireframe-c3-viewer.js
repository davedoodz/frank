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
let contextLost = false;
// The corner view is a second render of the same scene from a camera that
// never moves, plus a marker for where the live camera stands. One scene,
// two cameras: a picture of the building would be wrong the moment it is
// orbited.
let overview;
let overviewCamera;
let cameraMark;
let markRadius;
// Half the footprint, used to frame the roof plan in the corner.
let planHalf;
// Everything that belongs to the corner view only is on layer 1, which the
// main camera never renders.
const MARK_LAYER = 1;

function setStatus(host, state, message) {
  host.dataset.state = state;
  host.setAttribute("aria-busy", state === "loading" ? "true" : "false");
  const status = host.querySelector("[data-model-status]");
  if (status) status.textContent = message;
  // Anything hung on the model — the margin's pins, for one — only has a
  // camera to project through once the building is in the scene.
  window.dispatchEvent(new CustomEvent("fitte:model-state", { detail: state }));
}

function resize(host) {
  if (!renderer || !persp || !host.isConnected) return;
  const { width, height } = host.getBoundingClientRect();
  if (width < 2 || height < 2) return;

  renderer.setSize(width, height, false);
  persp.aspect = width / height;
  persp.updateProjectionMatrix();
  if (elevation) frameElevation(false);
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
  if (elevation) { frameElevation(true); return; }
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

// An elevation is orthographic: there is no distance to read, only the
// camera's zoom, from 0.6 (whole façade with room) to 8 (a window).
const ORTHO_ZOOM = { lo: 0.6, hi: 8 };
function readZoom() {
  if (camera?.isOrthographicCamera) {
    const t = (Math.log(camera.zoom) - Math.log(ORTHO_ZOOM.lo)) / (Math.log(ORTHO_ZOOM.hi) - Math.log(ORTHO_ZOOM.lo));
    return Math.round(Math.min(1, Math.max(0, t)) * 100);
  }
  const l = limits();
  if (!l) return null;
  const d = camera.position.distanceTo(controls.target);
  const t = (Math.log(d) - Math.log(l.lo)) / (Math.log(l.hi) - Math.log(l.lo));
  if (!Number.isFinite(t)) return null;
  return Math.round((1 - Math.min(1, Math.max(0, t))) * 100);
}

function writeZoom(percent) {
  if (!Number.isFinite(percent)) return;
  const p = Math.min(100, Math.max(0, percent)) / 100;
  if (camera?.isOrthographicCamera) {
    camera.zoom = Math.exp(Math.log(ORTHO_ZOOM.lo) + p * (Math.log(ORTHO_ZOOM.hi) - Math.log(ORTHO_ZOOM.lo)));
    camera.updateProjectionMatrix();
    controls.update();
    return;
  }
  const l = limits();
  if (!l) return;
  buildingSelection?.cancelFlight();
  const t = 1 - p;
  const d = Math.exp(Math.log(l.lo) + t * (Math.log(l.hi) - Math.log(l.lo)));
  const direction = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).add(direction.multiplyScalar(d));
  controls.update();
}

/* ------------------------------------------------------------ elevations
   A façade is shown the way the elevation sheet draws it: straight on,
   orthographic, every material of the legend in its own colour. The same
   render, drawn once per façade into an off-screen target with each
   material's legend number in place of its colour, is what the areas are
   counted from: a material's area on a façade is the area it covers in
   that elevation. Walls hidden behind a wall in front, and faces seen
   edge-on, are not in the elevation and are not counted. */
const FACES = {
  nord: new THREE.Vector3(0, 0, -1),
  est: new THREE.Vector3(1, 0, 0),
  sud: new THREE.Vector3(0, 0, 1),
  ouest: new THREE.Vector3(-1, 0, 0),
};
// The elevation marker in the corner plan: the letter the façade carries on
// the elevation sheets, and which way its arrow turns to face the building.
// Drawn pointing right (the west façade's marker, left of the building).
const FACE_MARK = {
  sud: { letter: "A", turn: 270 },
  est: { letter: "B", turn: 180 },
  nord: { letter: "C", turn: 90 },
  ouest: { letter: "D", turn: 0 },
};
// Room kept round the footprint in an elevation, in pixels of the corner
// view, so the marker sits outside the building and inside the frame.
const MARK_PAD = 24;
let overviewKey = "";
let overviewSight;
// Off-screen resolution of the area count, in model units per pixel
// (0.025 = 6 cm).
const COUNT_STEP = 0.025;
const NEUTRAL = "#ecebe7";
let persp;
let orthoCamera;
let elevation = null;
let elevationKey = "";
let buildingBox;
let facadeAreas = null;
const savedMaterials = new Map();
const elevationMaterials = new Map();
const elevationUniforms = {
  fitteFocus: { value: 0 },
  fitteIdPass: { value: 0 },
  fitteColors: { value: [] },
};

function legend() {
  return window.fitteMaterials;
}
function elevationMaterial(source) {
  if (elevationMaterials.has(source)) return elevationMaterials.get(source);
  const fm = legend();
  const metal = source.name === fm.METAL;
  const cat = metal ? 0 : fm.categoryOf(source.name, 0);
  const split = fm.METAL_SPLIT;
  const material = new THREE.MeshBasicMaterial({ side: source.side });
  material.toneMapped = false;
  material.visible = !fm.isProp(source.name);
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, elevationUniforms);
    shader.vertexShader = `varying float vFitteY;\n${shader.vertexShader.replace(
      "#include <project_vertex>",
      "#include <project_vertex>\n  vFitteY = (modelMatrix * vec4(transformed, 1.0)).y;")}`;
    const catExpr = metal
      ? `(y >= ${split.roof.toFixed(3)} || (y >= ${split.low.toFixed(3)} && y <= ${split.high.toFixed(3)})) ? 6 : 4`
      : `${cat}`;
    shader.fragmentShader = `varying float vFitteY;
uniform float fitteSourceY;
uniform int fitteFocus;
uniform float fitteIdPass;
uniform vec3 fitteColors[11];
${shader.fragmentShader
  .replace("vec4 diffuseColor = vec4( diffuse, opacity );", `float y = vFitteY + fitteSourceY;
  int fitteCat = ${catExpr};
  vec3 fitteCol = fitteColors[fitteCat];
  if (fitteFocus > 0 && fitteCat != fitteFocus) fitteCol = mix(fitteCol, fitteColors[0], 0.78);
  vec4 diffuseColor = vec4(fitteCol, 1.0);`)
  .replace("#include <dithering_fragment>", `#include <dithering_fragment>
  if (fitteIdPass > 0.5) gl_FragColor = vec4(float(fitteCat) / 255.0, 0.0, 0.0, 1.0);`)}`;
    shader.uniforms.fitteSourceY = { value: sourceCenter?.[1] || 0 };
  };
  material.customProgramCacheKey = () => `fitte-elevation-${metal ? "metal" : cat}`;
  elevationMaterials.set(source, material);
  return material;
}

function paintElevation(on) {
  if (!model) return;
  if (on && !savedMaterials.size) {
    elevationUniforms.fitteColors.value = [new THREE.Color(NEUTRAL),
      ...legend().CATEGORIES.map((c) => new THREE.Color(c.color))];
    model.traverse((mesh) => {
      if (!mesh.isMesh) return;
      savedMaterials.set(mesh, mesh.material);
      mesh.material = elevationMaterial(mesh.userData.fitteMaterial || mesh.material);
    });
  } else if (!on && savedMaterials.size) {
    for (const [mesh, material] of savedMaterials) mesh.material = material;
    savedMaterials.clear();
  }
}

// The orthographic camera stands off the named façade, looking at it
// square, framed on the building alone (the site and the trees are wider).
function placeOrtho(cam, face, aspect, margin) {
  const dir = FACES[face];
  const center = buildingBox.getCenter(new THREE.Vector3());
  const size = buildingBox.getSize(new THREE.Vector3());
  const across = Math.abs(dir.x) > 0 ? size.z : size.x;
  let halfW = across / 2 * margin, halfH = size.y / 2 * margin;
  if (aspect) {
    if (halfW / halfH > aspect) halfH = halfW / aspect;
    else halfW = halfH * aspect;
  }
  cam.left = -halfW; cam.right = halfW; cam.top = halfH; cam.bottom = -halfH;
  const reach = size.length();
  cam.near = 0.01;
  cam.far = reach * 4;
  cam.up.set(0, 1, 0);
  cam.position.copy(center).addScaledVector(dir, reach * 1.5);
  cam.lookAt(center);
  cam.updateProjectionMatrix();
  return center;
}

function frameElevation(reset) {
  if (!elevation || !orthoCamera || !buildingBox) return;
  const { width, height } = renderer.domElement.getBoundingClientRect();
  const zoom = orthoCamera.zoom;
  const target = controls.target.clone();
  const center = placeOrtho(orthoCamera, elevation.face, width / Math.max(height, 1), 1.08);
  if (reset) {
    orthoCamera.zoom = 1;
    controls.target.copy(center);
  } else {
    // A resize keeps the zoom and where the view was moved to.
    orthoCamera.zoom = zoom;
    orthoCamera.position.add(target.clone().sub(center));
    controls.target.copy(target);
  }
  orthoCamera.updateProjectionMatrix();
  controls.update();
}

function setElevation(next) {
  const key = next?.face ? `${next.face}:${next.focus || 0}` : "";
  if (key === elevationKey || !model) return;
  const faceChanged = (next?.face || "") !== (elevation?.face || "");
  elevationKey = key;
  elevation = next?.face && FACES[next.face] ? { face: next.face, focus: Number(next.focus) || 0 } : null;
  elevationUniforms.fitteFocus.value = elevation?.focus || 0;
  if (elevation) {
    buildingSelection?.cancelFlight();
    buildingSelection?.setEnabled(false);
    paintElevation(true);
    camera = orthoCamera;
    controls.object = orthoCamera;
    // An elevation is looked at, not walked around: moving and zooming
    // stay, turning goes.
    controls.enableRotate = false;
    applyTool();
    if (faceChanged) frameElevation(true);
  } else {
    paintElevation(false);
    camera = persp;
    controls.object = persp;
    controls.enableRotate = true;
    applyTool();
    resetCamera();
    buildingSelection?.setEnabled(true);
    buildingSelection?.sync({ frame: false });
  }
  renderer.domElement.dataset.elevation = elevation?.face || "";
  window.dispatchEvent(new CustomEvent("fitte:model-zoom", { detail: readZoom() }));
}

// Every façade drawn once off screen with each material's number for a
// colour, and the pixels counted.
function countFacades() {
  const fm = legend();
  const cam = new THREE.OrthographicCamera();
  const target = new THREE.WebGLRenderTarget(1, 1);
  const keepElevation = savedMaterials.size > 0;
  paintElevation(true);
  elevationUniforms.fitteIdPass.value = 1;
  elevationUniforms.fitteFocus.value = 0;
  const background = scene.background;
  scene.background = new THREE.Color(0, 0, 0);
  const toneMapping = renderer.toneMapping;
  renderer.toneMapping = THREE.NoToneMapping;
  const result = {};
  for (const face of Object.keys(FACES)) {
    placeOrtho(cam, face, 0, 1);
    const w = Math.ceil((cam.right - cam.left) / COUNT_STEP);
    const h = Math.ceil((cam.top - cam.bottom) / COUNT_STEP);
    target.setSize(w, h);
    renderer.setRenderTarget(target);
    renderer.render(scene, cam);
    const pixels = new Uint8Array(w * h * 4);
    renderer.readRenderTargetPixels(target, 0, 0, w, h, pixels);
    const counts = new Array(fm.CATEGORIES.length + 1).fill(0);
    for (let i = 0; i < pixels.length; i += 4) {
      const c = pixels[i];
      if (c > 0 && c < counts.length) counts[c] += 1;
    }
    const pixelFt2 = ((cam.right - cam.left) / w) * ((cam.top - cam.bottom) / h) * fm.FT2_PER_UNIT2;
    result[face] = fm.CATEGORIES
      .map((c) => ({ n: c.n, ft2: counts[c.n] * pixelFt2 }));
  }
  renderer.setRenderTarget(null);
  target.dispose();
  renderer.toneMapping = toneMapping;
  scene.background = background;
  elevationUniforms.fitteIdPass.value = 0;
  elevationUniforms.fitteFocus.value = elevation?.focus || 0;
  if (!keepElevation) paintElevation(false);
  return result;
}

function unitWindows(unit) {
  return buildingSelection?.unitWindows(unit) ?? null;
}

// What a left drag does: orbit the building, or move the view across it.
// The other button keeps the other gesture, so neither is ever lost.
let dragTool = "orbit";
// At rest the pointer is the hand that clicks, because a click on the
// building selects. Only while a button is held does it become the tool's
// glyph, which shows what the drag is doing. The glyph is black on a white
// halo, so it reads over glass and over render.
let dragging = false;
const toolCursors = {};
function toolCursor(tool) {
  const fallback = tool === "pan" ? "move" : "grab";
  if (toolCursors[tool]) return toolCursors[tool];
  const symbol = document.getElementById(tool === "pan" ? "lu-move" : "lu-rotate-3d");
  if (!symbol) return fallback;
  const art = symbol.innerHTML;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="-2 -2 28 28" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#fff" stroke-width="5">${art}</g><g stroke="#111" stroke-width="2">${art}</g></svg>`;
  toolCursors[tool] = `url("data:image/svg+xml,${encodeURIComponent(svg)}") 14 14, ${fallback}`;
  return toolCursors[tool];
}
function applyTool() {
  if (!controls) return;
  // In an elevation a drag only ever moves the view.
  const orbit = dragTool === "orbit" && !elevation;
  controls.mouseButtons.LEFT = orbit ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
  controls.mouseButtons.RIGHT = orbit ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
  controls.touches.ONE = orbit ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN;
  showCursor();
}
function showCursor() {
  if (!renderer) return;
  if (!dragging) { renderer.domElement.style.cursor = "pointer"; return; }
  // The right button carries the other gesture, so it shows the other glyph.
  const orbit = dragTool === "orbit" && !elevation;
  const held = dragging === "right" ? !orbit : orbit;
  renderer.domElement.style.cursor = toolCursor(held && !elevation ? "orbit" : "pan");
}
function setTool(tool) {
  dragTool = tool === "pan" ? "pan" : "orbit";
  applyTool();
}

// Notes stuck to the model are the page's data, not the viewer's: it is
// handed the list, and gives back a place on screen for each one plus the
// one thing only it can answer — what a click on the building hit.
window.fitteModel = {
  readZoom, writeZoom, reset: resetCamera, setPins, pick, setTool, unitWindows,
  // Square feet per legend material, per façade; null until the building
  // is loaded and counted. fitte:facades announces the moment it is.
  facades: () => facadeAreas,
};

let modelPins = [];
let pinSig = "";
function setPins(list) {
  modelPins = Array.isArray(list) ? list : [];
  pinSig = "";               // force the next frame to redraw
}
// A click on the building turned into a point in the model, plus what that
// point belongs to: the level, read from the same elevation table the unit
// selection uses, and the façade, read from the face normal.
function pick(clientX, clientY) {
  const canvas = renderer?.domElement;
  if (!canvas || !model) return null;
  const r = canvas.getBoundingClientRect();
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(
    ((clientX - r.left) / r.width) * 2 - 1,
    -((clientY - r.top) / r.height) * 2 + 1), camera);
  const hit = ray.intersectObject(model, true)[0];
  if (!hit) return null;
  const n = hit.face
    ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
    : new THREE.Vector3(0, 1, 0);
  return { p: [hit.point.x, hit.point.y, hit.point.z], n: [n.x, n.y, n.z],
    level: levelAt(hit.point.y), face: faceName(n) };
}
function levelAt(worldY) {
  const srcY = worldY + (sourceCenter?.[1] || 0);
  let level = 1;
  ELEVATIONS.forEach((e, i) => { if (srcY >= e - 0.1) level = Math.min(i + 1, 8); });
  return level;
}
function faceName(n) {
  const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
  if (ay > ax && ay > az) return n.y > 0 ? "toiture" : "sous-face";
  // North is -Z in this export, the same assumption the north mark uses.
  if (az > ax) return n.z > 0 ? "façade sud" : "façade nord";
  return n.x > 0 ? "façade est" : "façade ouest";
}
const pinVec = new THREE.Vector3();
const pinNorm = new THREE.Vector3();
const pinDir = new THREE.Vector3();
function paintPins() {
  const layer = document.querySelector("[data-npins]");
  if (!layer || !camera) return;
  const canvas = renderer.domElement;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  // Rewriting the markers sixty times a second for a building that is not
  // moving is waste: the camera and the list are the whole input.
  const sig = `${camera.matrixWorldInverse.elements.map((v) => v.toFixed(3)).join()}|${modelPins.length}|${w}x${h}`;
  if (sig === pinSig) return;
  pinSig = sig;
  layer.innerHTML = modelPins.map((pin) => {
    pinVec.set(pin.p[0], pin.p[1], pin.p[2]);
    // Stuck to a wall the camera is behind: dimmed, never hidden, so the
    // count in the margin and the count on screen keep agreeing.
    const back = pin.n
      ? pinDir.copy(pinVec).sub(camera.position).normalize()
          .dot(pinNorm.set(pin.n[0], pin.n[1], pin.n[2])) > 0
      : false;
    pinVec.project(camera);
    if (pinVec.z > 1) return "";
    const x = (pinVec.x * 0.5 + 0.5) * w, y = (-pinVec.y * 0.5 + 0.5) * h;
    return `<div class="npin ${pin.cls || ""} ${back ? "back" : ""}"
      style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px" data-act="note" data-value="${pin.id}">${pin.html}</div>`;
  }).join("");
}

function createRenderer() {
  scene = new THREE.Scene();
  /* No backdrop: the model stands on the pane's own white, like the plan. */
  scene.background = null;

  camera = new THREE.PerspectiveCamera(32, 1, 0.01, 1000);
  persp = camera;
  orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 1000);
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
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
  renderer.domElement.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.button !== 2) return;
    dragging = event.button === 2 ? "right" : "left";
    showCursor();
  }, true);
  const release = () => { if (!dragging) return; dragging = false; showCursor(); };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    contextLost = true;
    const host = document.querySelector("[data-building-model]");
    if (host) setStatus(host, "loading", "Restauration de la vue 3D…");
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    contextLost = false;
    mountBuildingViewer();
  });

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
  applyTool();
  // One sign for every device, and the same sign as the 2D sheet: the deltas
  // that enlarge the drawing bring the building closer. Sniffing the device
  // from the shape of the deltas could flip mid-swipe on a trackpad, and a
  // view that reverses under a continuous gesture cannot be aimed.
  controls.zoomSpeed = -controls.zoomSpeed;

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
  overviewSight = sight;

  renderer.setAnimationLoop((now) => {
    const canvas = renderer.domElement;
    if (contextLost || !canvas.isConnected || canvas.offsetParent === null) return;
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
    paintPins();
  });
}

// The second pass, into the canvas sitting in the corner of the pane. It
// shares the scene, the lights and the model: only the camera differs — and
// it looks straight down, so the corner view is a roof plan.
function renderOverview() {
  let canvas = document.querySelector("[data-mini3d]");
  if (!canvas || !overviewCamera || !planHalf) return;
  // UI renders replace the placeholder, not the GPU renderer. Keeping this
  // canvas avoids leaking a context and another copy of the model per click.
  if (overview && overview.domElement !== canvas) {
    canvas.replaceWith(overview.domElement);
    canvas = overview.domElement;
  }
  if (!overview) {
    try {
      overview = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
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
  const pad = elevation ? MARK_PAD : 0;
  const key = `${width}x${height}:${pad}`;
  if (key !== overviewKey || canvas.width !== Math.round(width * overview.getPixelRatio())) {
    overviewKey = key;
    overview.setSize(width, height, false);
    // The footprint is fitted inside the frame without stretching: one
    // scale for both axes, whichever of the two is the tighter.
    const scale = Math.max(planHalf.x / (width / 2 - pad), planHalf.z / (height / 2 - pad));
    overviewCamera.left = -scale * width / 2;
    overviewCamera.right = scale * width / 2;
    overviewCamera.top = scale * height / 2;
    overviewCamera.bottom = -scale * height / 2;
    overviewCamera.updateProjectionMatrix();
  }
  // In an elevation the façade's marker says where the building is seen
  // from; the live camera's ball and line would say it a second time.
  cameraMark.visible = !elevation;
  if (overviewSight) overviewSight.visible = !elevation;
  overview.render(scene, overviewCamera);
  paintElevationMark(canvas, width, height);
}

function paintElevationMark(canvas, width, height) {
  const host = canvas.parentElement;
  let mark = host.querySelector(":scope > .elevmark");
  const face = elevation && FACE_MARK[elevation.face];
  if (!face) { mark?.remove(); return; }
  if (!mark || mark.dataset.face !== elevation.face) {
    mark?.remove();
    mark = document.createElement("span");
    mark.className = "elevmark";
    mark.setAttribute("role", "img");
    mark.style.cssText = "position:absolute;width:24px;height:24px;pointer-events:none;line-height:0";
    mark.dataset.face = elevation.face;
    mark.setAttribute("aria-label", `Élévation ${face.letter}`);
    mark.innerHTML = `<svg viewBox="-12 -12 24 24" width="24" height="24" aria-hidden="true">
      <polygon points="-4.5,-10.5 11,0 -4.5,10.5" transform="rotate(${face.turn})" fill="#111" stroke="#111" stroke-width=".8" stroke-linejoin="round"/>
      <circle r="7.4" fill="#fff" stroke="#111" stroke-width="1"/>
      <text y="3.1" text-anchor="middle" font-size="8.6" font-family="Inter, system-ui, sans-serif" fill="#111">${face.letter}</text>
    </svg>`;
    host.append(mark);
  }
  // Just outside the footprint on the façade's side, the arrow towards it.
  const n = FACES[elevation.face];
  const unit = (overviewCamera.right - overviewCamera.left) / width;
  const x = width / 2 + n.x * (planHalf.x / unit + 12);
  const y = height / 2 + n.z * (planHalf.z / unit + 12);
  mark.style.left = `${x - 12}px`;
  mark.style.top = `${y - 12}px`;
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

function loadModel(host) {
  if (modelPromise) return modelPromise;

  const loader = new GLTFLoader();
  modelPromise = new Promise((resolve, reject) => {
    loader.load(
      MODEL_URL,
      (gltf) => {
        model = gltf.scene;
        const fm = legend();
        buildingBox = new THREE.Box3();
        model.traverse((object) => {
          if (!object.isMesh) return;
          object.castShadow = false;
          object.receiveShadow = false;
          // The export's own material, kept before the selection swaps a
          // unit's glazing for its highlight: the elevation colours by it.
          object.userData.fitteMaterial = object.material;
        });
        scene.add(model);
        fitModel(host);
        buildingSelection = createBuildingSelection({
          model, camera, controls, canvas: renderer.domElement, sourceCenter,
        });
        buildingSelection.sync();
        // Façades exist only on a page that carries the elevation legend.
        if (fm) {
          // The building alone, without the site: what is on the legend.
          model.updateMatrixWorld(true);
          model.traverse((object) => {
            if (object.isMesh && fm.categoryOf(object.material.name, 5) > 0) buildingBox.expandByObject(object);
          });
          try {
            facadeAreas = countFacades();
            window.dispatchEvent(new CustomEvent("fitte:facades", { detail: facadeAreas }));
          } catch (error) {
            console.error("Façade areas could not be counted", error);
          }
        }
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
  if (contextLost) {
    setStatus(host, "loading", "Restauration de la vue 3D…");
    return;
  }

  const reset = host.querySelector("[data-model-reset]");
  if (reset) reset.onclick = (event) => {
    event.stopPropagation();
    resetCamera();
  };

  if (model) {
    setElevation(window.fitteElevation);
    if (!elevation) buildingSelection?.sync();
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
    setElevation(window.fitteElevation);
    if (!elevation) buildingSelection?.sync();
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
