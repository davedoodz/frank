// Test bench for level markers on the C3 building model: one GLB, one
// camera, several stages. The model is rendered once per frame and copied
// into every stage; each variant paints only its SVG overlay, so the
// comparison is placement and drawing, never a different view.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createBuildingSelection, ELEVATIONS } from "./wireframe-c3-selection.js";

export const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const NAMES = (level) => level === 9 ? "Toiture" : `Niveau ${level}`;
export const SHORT = (level) => level === 9 ? "T" : String(level);

// Live state the variants read while painting.
export const B = {
  W: 1, H: 1, selected: 5, camera: null, hull: [], planHalf: null,
  // Page options (e.g. how unselected levels are shown), plus the pointer:
  // over a stage, and whether the model is being dragged.
  opts: {}, hover: false, dragging: false,
};

const v = new THREE.Vector3();
let sourceCenter;
export function proj(x, y, z) {
  v.set(x, y, z).project(B.camera);
  return { x: (v.x * 0.5 + 0.5) * B.W, y: (-v.y * 0.5 + 0.5) * B.H, behind: v.z > 1 };
}
export const slab = (level) => ELEVATIONS[level - 1] - sourceCenter[1];
export const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
// Geist Mono at 10 px: enough to place a label without measuring the DOM.
export const textWidth = (s, size = 10) => s.length * size * 0.61;

// Keep the selected level, then the ends, then whatever still has room.
export function cull(rows, gap = 13) {
  const order = [...rows].sort((a, b) => (b.level === B.selected) - (a.level === B.selected)
    || ((b.level === 9 || b.level === 1) - (a.level === 9 || a.level === 1)));
  const kept = [];
  for (const r of order) if (kept.every((k) => Math.abs(k.y - r.y) >= gap)) kept.push(r);
  return rows.filter((r) => kept.includes(r));
}

// One footprint vertex for every level, kept until another is clearly
// better: the corner a mark sits on no longer swaps every few degrees.
export function stickyVertex(state, score, margin) {
  let best = 0, bestScore = Infinity;
  B.hull.forEach((p, i) => { const s = score(p); if (s < bestScore) { bestScore = s; best = i; } });
  if (state.idx === undefined || !Number.isFinite(score(B.hull[state.idx]))
      || bestScore < score(B.hull[state.idx]) - margin) state.idx = best;
  return B.hull[state.idx];
}

// Eased screen positions: the mark follows its target closely enough to
// stay attached, softly enough not to jitter.
export function ease(state, level, target, t = 0.35) {
  state.pos ??= {};
  const prev = state.pos[level];
  const next = !prev || Math.abs(prev.x - target.x) > 200 ? { ...target }
    : { x: prev.x + (target.x - prev.x) * t, y: prev.y + (target.y - prev.y) * t };
  state.pos[level] = next;
  return next;
}

/* Each slab is pinned to the left edge of the real outline. A single
   leftmost corner would jump in height whenever another corner takes over,
   because the two lie at different depths; a soft minimum blends the
   corners near the edge instead, so the mark slides from one to the next. */
const SOFT = 14;
export function anchorAt(level) {
  const y = slab(level);
  const pts = B.hull.map((q) => proj(q.x, y, q.z)).filter((s) => !s.behind);
  if (!pts.length) return { level, behind: true, x: 0, y: 0 };
  const x = Math.min(...pts.map((s) => s.x));
  let sum = 0, sy = 0;
  for (const s of pts) { const w = Math.exp(-(s.x - x) / SOFT); sum += w; sy += w * s.y; }
  return { level, behind: false, x, y: sy / sum };
}
export const anchors = () => LEVELS.map(anchorAt);

// The outline of one slab as the camera sees it: the footprint edges whose
// outside faces the eye, in screen space, left to right.
export function frontOutline(level) {
  const hull = B.hull, y = slab(level), cam = B.camera.position;
  // The hull runs counter-clockwise in (x, z); its outward normal of edge
  // a→b is (dz, -dx).
  const out = [];
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length];
    const nx = b.z - a.z, nz = -(b.x - a.x);
    const mx = (a.x + b.x) / 2 - cam.x, mz = (a.z + b.z) / 2 - cam.z;
    if (nx * mx + nz * mz >= 0) continue;
    const pa = proj(a.x, y, a.z), pb = proj(b.x, y, b.z);
    if (pa.behind || pb.behind) continue;
    out.push([pa, pb]);
  }
  return out;
}

// Convex hull of the tower's geometry between level 3 and the roof, in
// plan: the outline seen from any side, balconies included, without the
// canopy, the site or the cars.
function footprint(model) {
  const lo = ELEVATIONS[2] - sourceCenter[1], hi = ELEVATIONS[8] - sourceCenter[1];
  const seen = new Set(), pts = [];
  const p = new THREE.Vector3();
  model.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const pos = mesh.geometry.attributes.position;
    const stride = Math.max(1, Math.floor(pos.count / 4000));
    for (let i = 0; i < pos.count; i += stride) {
      p.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      if (p.y < lo || p.y > hi) continue;
      const k = `${Math.round(p.x * 5)},${Math.round(p.z * 5)}`;
      if (seen.has(k)) continue;
      seen.add(k); pts.push({ x: p.x, z: p.z });
    }
  });
  pts.sort((a, b) => a.x - b.x || a.z - b.z);
  const cross = (o, a, b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lower = [], upper = [];
  for (const q of pts) { while (lower.length > 1 && cross(lower.at(-2), lower.at(-1), q) <= 0) lower.pop(); lower.push(q); }
  for (const q of [...pts].reverse()) { while (upper.length > 1 && cross(upper.at(-2), upper.at(-1), q) <= 0) upper.pop(); upper.push(q); }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/**
 * variants: [{ id, name, say, halo?, paint() → SVG string }]
 * options:  [{ key, label, choices: [[value, label], …], value }] — extra
 *           segmented controls written to B.opts.
 * margin:   px of empty frame kept left of the building for marks; the view
 *           is centred that much to the right of the stage.
 * fit:      camera distance as a multiple of the distance that fits the
 *           model's bounding sphere into the stage's narrower field of view.
 */
export function mountBench({ variants, options = [], margin = 0, fit = 1 }) {
  const bar = document.getElementById("bar");
  bar.insertAdjacentHTML("beforeend",
    `<span class="lb">Niveau sélectionné</span>`
    + LEVELS.map((l) => `<button data-level="${l}" aria-pressed="${l === B.selected}">${NAMES(l)}</button>`).join("")
    + options.map((o) => {
      B.opts[o.key] = o.value;
      return `<span class="sp"></span><span class="lb">${esc(o.label)}</span>`
        + o.choices.map(([value, label]) =>
          `<button data-opt="${o.key}" data-value="${value}" aria-pressed="${value === o.value}">${esc(label)}</button>`).join("");
    }).join("")
    + `<span class="sp"></span><button data-act="spin" aria-pressed="false">Orbite auto</button>
       <button data-act="home">Vue initiale</button><span class="st" id="status">Chargement de la maquette…</span>`);
  const grid = document.getElementById("grid");
  grid.innerHTML = variants.map((d) => `<section class="card">
    <h2><span>${d.id}</span>${esc(d.name)}</h2><p class="say">${d.say}</p>
    <div class="stage" data-stage="${d.id}"><canvas></canvas><svg class="${d.halo === false ? "" : "halo"}"></svg></div></section>`).join("");
  const stages = variants.map((d) => {
    const el = grid.querySelector(`[data-stage="${d.id}"]`);
    const canvas = el.querySelector("canvas");
    return { d, el, canvas, ctx: canvas.getContext("2d"), svg: el.querySelector("svg") };
  });

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf1f3f4);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8c9094, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(18, 28, 22); scene.add(key);
  const fill = new THREE.DirectionalLight(0xdde8f2, 1.4); fill.position.set(-20, 10, -16); scene.add(fill);
  const camera = B.camera = new THREE.PerspectiveCamera(32, 1, 0.01, 1000);

  // One camera, one shared target, a control per stage: whichever stage is
  // dragged moves the camera every stage renders through.
  const target = new THREE.Vector3();
  const controls = stages.map(({ el }) => {
    const c = new OrbitControls(camera, el);
    c.target = target;
    c.enableDamping = true; c.dampingFactor = 0.075; c.screenSpacePanning = true;
    el.addEventListener("pointerenter", () => { B.hover = true; });
    el.addEventListener("pointerleave", () => { B.hover = false; });
    el.addEventListener("pointerdown", () => { B.dragging = true; });
    return c;
  });
  addEventListener("pointerup", () => { B.dragging = false; });

  let home, selection;
  // A wider virtual frame of which the stage shows the left part: the view
  // sits right of centre and proj() reads the same matrix, so marks stay
  // registered.
  function resize() {
    const r = stages[0].el.getBoundingClientRect();
    B.W = r.width; B.H = r.height;
    renderer.setSize(B.W, B.H, false);
    camera.aspect = (B.W + margin) / B.H;
    camera.setViewOffset(B.W + margin, B.H, 0, 0, B.W, B.H);
    for (const s of stages) {
      s.canvas.width = Math.round(B.W * dpr); s.canvas.height = Math.round(B.H * dpr);
      s.svg.setAttribute("viewBox", `0 0 ${B.W} ${B.H}`);
    }
  }
  new ResizeObserver(resize).observe(stages[0].el);

  function frame() {
    for (const c of controls) c.update();
    renderer.render(scene, camera);
    camera.updateMatrixWorld();
    for (const s of stages) {
      s.ctx.drawImage(renderer.domElement, 0, 0, s.canvas.width, s.canvas.height);
      s.svg.innerHTML = s.d.paint();
    }
  }

  const status = document.getElementById("status");
  new GLTFLoader().load("assets/building.glb", (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    sourceCenter = center.toArray();
    model.position.sub(center);
    model.updateMatrixWorld(true);
    B.planHalf = { x: size.x / 2 * 1.08, z: size.z / 2 * 1.08 };
    B.hull = footprint(model);
    const radius = Math.max(size.length() / 2, 1);
    // Fitted to the narrower field of view of the portrait stage.
    const r = stages[0].el.getBoundingClientRect();
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (r.width / r.height));
    const distance = radius / Math.sin(Math.min(vfov, hfov) / 2) * fit;
    camera.near = Math.max(distance / 1000, 0.01); camera.far = distance * 20;
    camera.position.copy(new THREE.Vector3(1.05, 0.48, 1.25).normalize().multiplyScalar(distance));
    camera.updateProjectionMatrix();
    for (const c of controls) { c.minDistance = radius * 0.35; c.maxDistance = radius * 8; }
    home = camera.position.clone();
    // The live pane's floor band, so each stage shows which level is meant.
    selection = createBuildingSelection({ model, camera, controls: controls[0], canvas: renderer.domElement, sourceCenter });
    window.fitteSelection = { level: B.selected };
    selection.sync({ frame: false });
    status.textContent = `${B.hull.length} sommets d'emprise`;
    resize();
    renderer.setAnimationLoop(frame);
  }, (e) => { if (e.total) status.textContent = `Chargement de la maquette… ${Math.round(e.loaded / e.total * 100)} %`; },
  (err) => { status.textContent = "Impossible de charger la maquette."; console.error(err); });

  bar.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.level) {
      B.selected = Number(b.dataset.level);
      bar.querySelectorAll("[data-level]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      window.fitteSelection = { level: B.selected };
      selection?.sync({ frame: false });
    } else if (b.dataset.opt) {
      B.opts[b.dataset.opt] = b.dataset.value;
      bar.querySelectorAll(`[data-opt="${b.dataset.opt}"]`).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    } else if (b.dataset.act === "spin") {
      controls[0].autoRotate = !controls[0].autoRotate;
      controls[0].autoRotateSpeed = 3;
      b.setAttribute("aria-pressed", String(controls[0].autoRotate));
    } else if (b.dataset.act === "home" && home) {
      camera.position.copy(home); target.set(0, 0, 0);
    }
  });
}
