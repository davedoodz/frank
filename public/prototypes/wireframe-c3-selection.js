import * as THREE from "three";

// Source-model elevations, measured from the repeated facade window bands.
// The glazing above 10.05 is the roof pavilion, not an apartment floor.
// Each entry is the top of the slab a level stands on.
export const ELEVATIONS = [0.05, 1.32, 2.52, 3.72, 4.92, 6.12, 7.32, 8.52, 10.05];
// Facade landmarks register the exported model to the cropped permit sheets.
// This is spatial registration, not a verified CAD unit/window association.
const X_ANCHORS = [[23.7, 314], [48.1, 1488]];
const Z_ANCHORS = [[-27, 328], [-7.5, 1271]];
// The ground-floor sheet places the same building 41 px left and 8 px down.
const FLOOR_SHEET_OFFSETS = { 1: [-41, 8] };
// How far outside a unit's plan outline a window still belongs to it, in
// normalised sheet units. Measured on a typical floor: the balcony rails
// reach 0.0325 beyond the outline, everything else less.
const UNIT_MARGIN = 0.035;
// This close to a typical floor's outlines a surface is the building's;
// further out it is the site.
const FLOOR_MARGIN = 0.06;
// Units per floor and outline edges the hover shader can hold.
const MAX_UNITS = 16;
const MAX_EDGES = 256;

// Model x/z to normalised sheet coordinates on a level. Both registrations
// are two-anchor linear maps, so the whole mapping is a scale and a bias per
// axis, which is also what the shader is given.
function sheetMap(level, sourceOffset) {
  const offset = FLOOR_SHEET_OFFSETS[level] || [0, 0];
  const axis = ([[s0, p0], [s1, p1]], origin, extra, size) => {
    const k = (p1 - p0) / (s1 - s0);
    return [k / size, (p0 + (origin - s0) * k + extra) / size];
  };
  const [ku, bu] = axis(X_ANCHORS, sourceOffset.x, offset[0], 2000);
  const [kv, bv] = axis(Z_ANCHORS, sourceOffset.z, offset[1], 1675);
  return { ku, bu, kv, bv };
}

function polygonDistance(point, polygon) {
  let inside = false;
  let distance = Infinity;
  const [x, y] = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, ay] = polygon[j], [bx, by] = polygon[i];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    distance = Math.min(distance, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return inside ? 0 : distance;
}

export function createBuildingSelection({ model, camera, controls, canvas, sourceCenter }) {
  const sourceOffset = new THREE.Vector3(...sourceCenter);
  // One texel per outline edge: row 0 holds its two ends, row 1 the index
  // of the unit it bounds.
  const edgeData = new Float32Array(MAX_EDGES * 2 * 4);
  const edgeTexture = new THREE.DataTexture(edgeData, MAX_EDGES, 2, THREE.RGBAFormat, THREE.FloatType);
  edgeTexture.minFilter = edgeTexture.magFilter = THREE.NearestFilter;
  const floorUniforms = {
    fitteFloorMin: { value: 0 },
    fitteFloorMax: { value: 0 },
    fitteFloorOn: { value: 0 },
    // The floor under the pointer, and the unit on it a click would pick.
    fitteHoverMin: { value: 0 },
    fitteHoverMax: { value: 0 },
    fitteHoverOn: { value: 0 },
    fitteHoverUnit: { value: -1 },
    fitteSheet: { value: new THREE.Vector4() },
    fitteEdges: { value: edgeTexture },
    fitteEdgeCount: { value: 0 },
    fitteUnitCount: { value: 0 },
  };
  const highlight = new THREE.MeshStandardMaterial({
    color: 0xa9d82e, emissive: 0x526c0b, emissiveIntensity: 0.45,
    roughness: 0.35, metalness: 0, side: THREE.DoubleSide,
  });
  const windows = [];
  const byUnit = new Map();
  let selected = [];
  let selectionKey = null;
  let mappedContours = null;
  let flight = null;
  // Off while the viewer shows an elevation: no hover, no click, no tag.
  let enabled = true;
  let pointerStart = null;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const materials = new Set();

  model.updateMatrixWorld(true);
  model.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const meshMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of meshMaterials) materials.add(material);
    // The export's other glass materials are balcony rails and cars. Only
    // this material is residential/storefront window and door glazing.
    if (meshMaterials.length !== 1 || meshMaterials[0].name !== "Translucent_Glass_Gray") return;
    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    const source = center.clone().add(sourceOffset);
    const level = ELEVATIONS.findIndex((upper, i) => i > 0 && source.y < upper);
    if (source.y < ELEVATIONS[0] || level < 1) return;
    windows.push({ mesh, box, center, source, level, material: mesh.material });
  });

  // Every surface is tinted by where it is: the selected floor's band, and
  // on the hovered floor whatever lies nearest the hovered unit's outline —
  // or, for the ground floor and the roof, which are not units, the whole
  // band inside the building's footprint. The shader runs the same rules as
  // hitAt() below, so what lights up is exactly what a click selects.
  const unitAtGlsl = `
int fitteUnitAt(vec2 p, out float nearest) {
  float dist[${MAX_UNITS}];
  bool inside[${MAX_UNITS}];
  for (int u = 0; u < ${MAX_UNITS}; u++) { dist[u] = 1e9; inside[u] = false; }
  for (int i = 0; i < ${MAX_EDGES}; i++) {
    if (i >= fitteEdgeCount) break;
    vec4 e = texelFetch(fitteEdges, ivec2(i, 0), 0);
    int u = int(texelFetch(fitteEdges, ivec2(i, 1), 0).r + 0.5);
    vec2 a = e.xy, d = e.zw - e.xy;
    if ((a.y > p.y) != (e.w > p.y) && p.x < d.x * (p.y - a.y) / d.y + a.x) inside[u] = !inside[u];
    float t = clamp(dot(p - a, d) / max(dot(d, d), 1e-12), 0.0, 1.0);
    dist[u] = min(dist[u], length(p - a - t * d));
  }
  int best = -1;
  float bestD = 1e9;
  for (int u = 0; u < ${MAX_UNITS}; u++) {
    if (u >= fitteUnitCount) break;
    float du = inside[u] ? 0.0 : dist[u];
    if (du < bestD) { best = u; bestD = du; }
  }
  nearest = bestD;
  return best;
}
`;
  const tintGlsl = `
if (fitteFloorOn > 0.5 && fitteWorld.y >= fitteFloorMin && fitteWorld.y < fitteFloorMax) { diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.58, 0.72, 0.20), 0.28); }
if (fitteHoverOn > 0.5 && fitteWorld.y >= fitteHoverMin && fitteWorld.y < fitteHoverMax) {
  vec2 p = vec2(fitteSheet.x * fitteWorld.x + fitteSheet.y, fitteSheet.z * fitteWorld.z + fitteSheet.w);
  float nearest;
  int unit = fitteUnitAt(p, nearest);
  bool lit = fitteHoverUnit > -0.5 ? unit == int(fitteHoverUnit + 0.5) : nearest <= ${FLOOR_MARGIN.toFixed(4)};
  if (lit) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.70, 0.88, 0.16), 0.5);
}`;
  for (const material of materials) {
    if (!material.isMeshStandardMaterial) continue;
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, floorUniforms);
      shader.vertexShader = "varying vec3 fitteWorld;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>",
        "#include <project_vertex>\nfitteWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      shader.fragmentShader = `varying vec3 fitteWorld;
uniform float fitteFloorMin, fitteFloorMax, fitteFloorOn;
uniform float fitteHoverMin, fitteHoverMax, fitteHoverOn, fitteHoverUnit;
uniform vec4 fitteSheet;
uniform sampler2D fitteEdges;
uniform int fitteEdgeCount, fitteUnitCount;
${unitAtGlsl}` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>",
        `#include <color_fragment>${tintGlsl}`);
    };
    material.customProgramCacheKey = () => "fitte-floor-band-v3";
    material.needsUpdate = true;
  }

  // A level's unit outlines, in the order the shader indexes them.
  function outlines(level) {
    const polygons = window.fitteContours?.[level] || window.fitteContours?.typical || {};
    return Object.entries(polygons).filter(([, polygon]) => polygon?.length >= 3);
  }
  const sheets = new Map();
  function sheetFor(level) {
    if (!sheets.has(level)) sheets.set(level, sheetMap(level, sourceOffset));
    return sheets.get(level);
  }
  function sheetPoint(level, world) {
    const m = sheetFor(level);
    return [m.ku * world.x + m.bu, m.kv * world.z + m.bv];
  }
  // The unit outline nearest a point of the model on a level: 0 inside it,
  // otherwise the distance to its edge on the sheet.
  function unitAt(level, world) {
    const point = sheetPoint(level, world);
    let closest = null, distance = Infinity;
    outlines(level).forEach(([suffix, polygon], index) => {
      const d = polygonDistance(point, polygon);
      if (d < distance) { closest = { suffix, polygon, index }; distance = d; }
    });
    return { point, closest, distance };
  }

  function mapWindows() {
    const contours = window.fitteContours;
    if (!contours || contours === mappedContours) return;
    mappedContours = contours;
    byUnit.clear();
    for (const item of windows) {
      const { point, closest, distance } = unitAt(item.level, item.center);
      // Reject common-area/roof/unregistered geometry instead of guessing.
      if (!closest || distance > UNIT_MARGIN) continue;
      const unit = `${item.level}${closest.suffix.padStart(2, "0")}`;
      const polygon = closest.polygon;
      const centroid = polygon.reduce((sum, p) => [sum[0] + p[0] / polygon.length, sum[1] + p[1] / polygon.length], [0, 0]);
      item.normal = new THREE.Vector3(point[0] - centroid[0], 0, point[1] - centroid[1]).normalize();
      if (!byUnit.has(unit)) byUnit.set(unit, []);
      byUnit.get(unit).push(item);
    }
  }

  // What is selected is already named in the pane header, the unit list and
  // the inspector, so nothing is written over the model. The dataset still
  // carries it, which is what tests and the rest of the page read.
  function label(selection) {
    const host = document.querySelector("[data-building-model]");
    if (!host) return;
    host.dataset.selectedLevel = selection?.level ?? "";
    host.dataset.selectedUnit = selection?.unit ?? "";
    host.dataset.highlightedWindows = String(selected.length);
  }

  function frameWindows() {
    if (!selected.length) return;
    const box = new THREE.Box3();
    const normal = new THREE.Vector3();
    for (const item of selected) { box.union(item.box); normal.add(item.normal); }
    const target = box.getCenter(new THREE.Vector3());
    const radius = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 0.8);
    if (normal.lengthSq() < 0.01) normal.copy(camera.position).sub(target).setY(0);
    normal.normalize().setY(0.28).normalize();
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const distance = Math.max(controls.minDistance * 1.1, radius / Math.sin(Math.min(verticalFov, horizontalFov) / 2) * 1.4);
    flight = { start: performance.now(), from: camera.position.clone(), fromTarget: controls.target.clone(), target,
      position: target.clone().addScaledVector(normal, distance), duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 550 };
  }

  // A level picked from the whole building's table is flown to: the
  // camera keeps its bearing, drops to the floor's height and comes in
  // until the lit band reads as a floor rather than a stripe.
  function frameLevel(level) {
    const min = floorUniforms.fitteFloorMin.value, max = floorUniforms.fitteFloorMax.value;
    if (!(level >= 1 && level <= 9) || !(max > min)) return false;
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const target = new THREE.Vector3(center.x, (min + max) / 2, center.z);
    const radius = Math.max(Math.max(size.x, size.z) * 0.32, (max - min) * 3);
    const bearing = camera.position.clone().sub(controls.target).setY(0);
    if (bearing.lengthSq() < 0.01) bearing.set(1, 0, 1);
    bearing.normalize().setY(0.3).normalize();
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const distance = Math.max(controls.minDistance * 1.1, radius / Math.sin(Math.min(verticalFov, horizontalFov) / 2));
    flight = { start: performance.now(), from: camera.position.clone(), fromTarget: controls.target.clone(), target,
      position: target.clone().addScaledVector(bearing, distance), duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 550 };
    return true;
  }

  function sync({ frame = true } = {}) {
    mapWindows();
    const selection = window.fitteSelection || {};
    const key = `${selection.level}:${selection.unit}`;
    const changed = selectionKey !== key;
    selectionKey = key;
    for (const item of selected) item.mesh.material = item.material;
    selected = byUnit.get(String(selection.unit)) || [];
    for (const item of selected) item.mesh.material = highlight;
    const level = Number(selection.level);
    // The roof pavilion exists in this export; neither basement does.
    floorUniforms.fitteFloorOn.value = level >= 1 && level <= 9 ? 1 : 0;
    floorUniforms.fitteFloorMin.value = (ELEVATIONS[level - 1] || 0) - sourceOffset.y;
    floorUniforms.fitteFloorMax.value = (level === 9 ? 12.36 : ELEVATIONS[level] || 0) - sourceOffset.y;
    label(selection);
    placeSelPill();
    /* A unit is flown to; a floor is stood back from, unless the floor was
       asked for from the whole building, where it is flown to. With nothing
       chosen the camera returns to the whole building, where a lit band
       means something — a floor tint read from six inches off one façade
       is just a brighter wall. */
    if (!changed || !frame) return;
    if (selected.length) frameWindows();
    else if (!(selection.frame === "level" && frameLevel(level))) window.fitteModel?.reset();
  }
  // One raycast answers both hover and click. The first surface hit names
  // a floor by its height and, from the second floor up, always a unit:
  // the one whose outline is nearest on the sheet — its windows, its
  // balcony, the wall around and between them, and any stretch of the floor
  // its sheet leaves unoutlined. The ground floor is a floor, not a unit;
  // anything at or above the roof slab is the roof page.
  function hitAt(clientX, clientY) {
    const bounds = canvas.getBoundingClientRect();
    pointer.set((clientX - bounds.left) / bounds.width * 2 - 1, -(clientY - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const first = raycaster.intersectObject(model, true)[0];
    if (!first) return null;
    const y = first.point.y + sourceOffset.y;
    if (y >= ELEVATIONS[8] - 0.02) return { roof: true };
    if (y < ELEVATIONS[0]) return null;
    let level = 1;
    while (level < 8 && y >= ELEVATIONS[level]) level += 1;
    const { closest, distance } = unitAt(level, first.point);
    if (Math.min(distance, unitAt(3, first.point).distance) > FLOOR_MARGIN) return null;
    if (level === 1 || !closest) return { level };
    return { level, unit: `${level}${closest.suffix.padStart(2, "0")}`, index: closest.index };
  }

  // What the pointer is over is lit before it is clicked, the same way
  // whether it is a unit, the ground floor or the roof; never a whole
  // apartment floor.
  // The outlines currently uploaded to the shader: one floor's at a time.
  let uploaded = { contours: null, level: null };
  function tintHover(next) {
    const level = next?.roof ? 9 : next?.level;
    floorUniforms.fitteHoverOn.value = level ? 1 : 0;
    if (!level) return;
    // A unit is matched against its own floor's outlines; the ground floor
    // and the roof against the typical floor's, as hitAt()'s footprint is.
    const unit = Boolean(next.unit);
    floorUniforms.fitteHoverUnit.value = unit ? next.index : -1;
    floorUniforms.fitteHoverMin.value = ELEVATIONS[level - 1] - sourceOffset.y;
    floorUniforms.fitteHoverMax.value = (level === 9 ? 12.36 : ELEVATIONS[level]) - sourceOffset.y;
    const sheetLevel = unit ? level : 3;
    const m = sheetFor(sheetLevel);
    floorUniforms.fitteSheet.value.set(m.ku, m.bu, m.kv, m.bv);
    if (uploaded.contours === window.fitteContours && uploaded.level === sheetLevel) return;
    uploaded = { contours: window.fitteContours, level: sheetLevel };
    const list = outlines(sheetLevel).slice(0, MAX_UNITS);
    let edges = 0;
    list.forEach(([, polygon], index) => {
      for (let i = 0, j = polygon.length - 1; i < polygon.length && edges < MAX_EDGES; j = i++, edges++) {
        edgeData.set([polygon[j][0], polygon[j][1], polygon[i][0], polygon[i][1]], edges * 4);
        edgeData[(MAX_EDGES + edges) * 4] = index;
      }
    });
    floorUniforms.fitteEdgeCount.value = edges;
    floorUniforms.fitteUnitCount.value = list.length;
    edgeTexture.needsUpdate = true;
  }

  // The chosen unit is named on the model too, not only in the list and
  // the header: looking at a façade, the one thing wanted is which of these
  // windows is 501. The tag sits on top of that unit's glazing, so it holds
  // still on the building while the camera turns.
  let selPill = null;
  const selAnchor = new THREE.Vector3();
  function placeSelPill() {
    const host = canvas.parentElement;
    const name = window.fitteSelection?.unit;
    // While the pointer names the same unit, one tag is enough. An
    // elevation is read for its materials, not its units: no tag.
    if (!enabled || !host || !name || !selected.length || hover?.unit === name) {
      if (selPill) selPill.hidden = true;
      return;
    }
    const box = new THREE.Box3();
    for (const item of selected) box.union(item.box);
    selAnchor.set((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2).project(camera);
    if (!selPill) { selPill = document.createElement("div"); selPill.className = "mpill sel"; }
    if (selPill.parentElement !== host) host.append(selPill);
    const bounds = canvas.getBoundingClientRect();
    selPill.textContent = name;
    selPill.style.left = `${((selAnchor.x * 0.5 + 0.5) * bounds.width).toFixed(1)}px`;
    selPill.style.top = `${((-selAnchor.y * 0.5 + 0.5) * bounds.height).toFixed(1)}px`;
    selPill.hidden = selAnchor.z > 1;
  }

  // The hover pill names what a click would select, the way the plan tags
  // a unit. A unit's pill sits over its own glazing, so it holds still
  // while the pointer crosses that unit; a floor's or the roof's follows it.
  let hover = null;
  let hoverAt = null;
  let hoverFrame = 0;
  let pill = null;
  const anchor = new THREE.Vector3();
  function setHover(next, x, y) {
    const items = next?.unit && byUnit.get(next.unit);
    if (items?.length) {
      const box = new THREE.Box3();
      for (const item of items) box.union(item.box);
      next.top = new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2);
    }
    hover = next;
    hoverAt = next ? { x, y } : null;
    tintHover(next);
    placePill();
  }
  function placePill() {
    const host = canvas.parentElement;
    if (!hover || !host) { if (pill) pill.hidden = true; return; }
    if (!pill) { pill = document.createElement("div"); pill.className = "mpill"; }
    if (pill.parentElement !== host) host.append(pill);
    const bounds = canvas.getBoundingClientRect();
    let x, y;
    if (hover.top) {
      anchor.copy(hover.top).project(camera);
      x = (anchor.x * 0.5 + 0.5) * bounds.width;
      y = (-anchor.y * 0.5 + 0.5) * bounds.height;
    } else {
      x = hoverAt.x - bounds.left;
      y = hoverAt.y - bounds.top - 8;
    }
    pill.textContent = hover.unit || (hover.roof ? "Toiture" : `Niveau ${hover.level}`);
    pill.style.left = `${x.toFixed(1)}px`;
    pill.style.top = `${y.toFixed(1)}px`;
    pill.hidden = false;
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (!enabled) return;
    pointerStart = { x: event.clientX, y: event.clientY, button: event.button };
    flight = null;
    setHover(null);
  });
  canvas.addEventListener("wheel", () => { flight = null; }, { passive: true });
  canvas.addEventListener("keydown", () => { flight = null; });
  canvas.addEventListener("pointercancel", () => { pointerStart = null; });
  canvas.addEventListener("pointerleave", () => { cancelAnimationFrame(hoverFrame); setHover(null); });
  canvas.addEventListener("pointermove", (event) => {
    // No hover while orbiting or on touch: the pill would chase the drag.
    if (!enabled || event.buttons || event.pointerType === "touch") return;
    const { clientX, clientY } = event;
    cancelAnimationFrame(hoverFrame);
    hoverFrame = requestAnimationFrame(() => setHover(hitAt(clientX, clientY), clientX, clientY));
  });
  canvas.addEventListener("pointerup", (event) => {
    const start = pointerStart;
    pointerStart = null;
    if (!start || start.button !== 0 || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) return;
    const hit = hitAt(event.clientX, event.clientY);
    // A unit the list does not carry (the ground floor's shops) still
    // brings its floor up.
    if (hit?.roof) window.fitteSelectLevel?.(9);
    else if (hit?.level && !(hit.unit && window.fitteSelectUnit?.(hit.unit))) window.fitteSelectLevel?.(hit.level);
    setHover(hit, event.clientX, event.clientY);
  });

  /* A unit's glazing, counted the way a window schedule counts it. The
     export models each pane separately; panes of one opening touch, so
     panes on the same face less than 8 cm apart are one window. Measured
     on level 5: window panes start 0.37 above the slab and are 0.77 high
     (6'-5"); patio-door panes start 0.25 above it and are 0.90 high
     (7'-6"). An opening at least 0.85 high and starting under 0.30 is a
     patio door. */
  const PANE_GAP = 0.03;
  const DOOR_HEIGHT = 0.85;
  const SILL_FROM_FLOOR = 0.3;
  function unitWindows(unit) {
    mapWindows();
    const items = byUnit.get(String(unit));
    if (!items) return null;
    const faceOf = (item) => {
      const size = item.box.getSize(new THREE.Vector3());
      const alongX = size.x >= size.z;
      // The pane is a plane: its thin axis is its normal; which way it
      // faces is the side of the unit it is on.
      if (alongX) return item.normal.z > 0 ? "sud" : "nord";
      return item.normal.x > 0 ? "est" : "ouest";
    };
    const panes = items.map((item) => ({ item, face: faceOf(item), box: item.box }));
    const parent = panes.map((_, i) => i);
    const root = (i) => (parent[i] === i ? i : (parent[i] = root(parent[i])));
    panes.forEach((a, i) => panes.forEach((b, j) => {
      if (j <= i || a.face !== b.face) return;
      const near = a.box.clone().expandByScalar(PANE_GAP).intersectsBox(b.box);
      if (near) parent[root(i)] = root(j);
    }));
    const groups = new Map();
    panes.forEach((pane, i) => {
      const key = root(i);
      if (!groups.has(key)) groups.set(key, { face: pane.face, box: new THREE.Box3(), area: 0 });
      const g = groups.get(key);
      g.box.union(pane.box);
      const s = pane.box.getSize(new THREE.Vector3());
      g.area += Math.max(s.x, s.z) * s.y;
    });
    const faces = {};
    for (const g of groups.values()) {
      const floor = (ELEVATIONS[Number(String(unit).slice(0, -2)) - 1] ?? 0) - sourceOffset.y;
      const door = g.box.max.y - g.box.min.y > DOOR_HEIGHT && g.box.min.y - floor < SILL_FROM_FLOOR;
      const f = (faces[g.face] ||= { face: g.face, windows: 0, doors: 0, glass: 0 });
      if (door) f.doors += 1; else f.windows += 1;
      f.glass += g.area;
    }
    return Object.values(faces);
  }

  return {
    sync,
    unitWindows,
    setEnabled(on) {
      enabled = Boolean(on);
      if (enabled) return;
      pointerStart = null;
      setHover(null);
      placeSelPill();
    },
    cancelFlight() { flight = null; },
    update(now) {
      // Damping keeps the camera moving after a release: keep the pill on
      // its glazing rather than where the glazing was.
      if (hover) placePill();
      placeSelPill();
      if (!flight) return;
      const t = flight.duration ? Math.min(1, (now - flight.start) / flight.duration) : 1;
      const ease = t * t * (3 - 2 * t);
      camera.position.lerpVectors(flight.from, flight.position, ease);
      controls.target.lerpVectors(flight.fromTarget, flight.target, ease);
      if (t === 1) flight = null;
    },
  };
}
