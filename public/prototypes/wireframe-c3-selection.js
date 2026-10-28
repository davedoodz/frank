import * as THREE from "three";

// Source-model elevations, measured from the repeated facade window bands.
// The glazing above 10.05 is the roof pavilion, not an apartment floor.
// Each entry is the top of the slab a level stands on, which is what the
// level markers in the pane point at.
export const ELEVATIONS = [0.05, 1.32, 2.52, 3.72, 4.92, 6.12, 7.32, 8.52, 10.05];
// Facade landmarks register the exported model to the cropped permit sheets.
// This is spatial registration, not a verified CAD unit/window association.
const X_ANCHORS = [[23.7, 314], [48.1, 1488]];
const Z_ANCHORS = [[-27, 328], [-7.5, 1271]];
// The ground-floor sheet places the same building 41 px left and 8 px down.
const FLOOR_SHEET_OFFSETS = { 1: [-41, 8] };

function interpolate(value, anchors) {
  let i = 0;
  while (i < anchors.length - 2 && value > anchors[i + 1][0]) i++;
  const [a, b] = [anchors[i], anchors[i + 1]];
  return a[1] + (value - a[0]) * (b[1] - a[1]) / (b[0] - a[0]);
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
  const floorUniforms = {
    fitteFloorMin: { value: 0 },
    fitteFloorMax: { value: 0 },
    fitteFloorOn: { value: 0 },
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

  for (const material of materials) {
    if (!material.isMeshStandardMaterial) continue;
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, floorUniforms);
      shader.vertexShader = "varying float fitteWorldY;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>",
        "#include <project_vertex>\nfitteWorldY = (modelMatrix * vec4(transformed, 1.0)).y;");
      shader.fragmentShader = "varying float fitteWorldY;\nuniform float fitteFloorMin;\nuniform float fitteFloorMax;\nuniform float fitteFloorOn;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>",
        "#include <color_fragment>\nif (fitteFloorOn > 0.5 && fitteWorldY >= fitteFloorMin && fitteWorldY < fitteFloorMax) { diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.58, 0.72, 0.20), 0.28); }");
    };
    material.customProgramCacheKey = () => "fitte-floor-band-v1";
    material.needsUpdate = true;
  }

  function mapWindows() {
    const contours = window.fitteContours;
    if (!contours || contours === mappedContours) return;
    mappedContours = contours;
    byUnit.clear();
    for (const item of windows) {
      delete item.mesh.userData.fitteUnit;
      const polygons = contours[item.level] || contours.typical;
      if (!polygons) continue;
      const offset = FLOOR_SHEET_OFFSETS[item.level];
      const point = [
        (interpolate(item.source.x, X_ANCHORS) + (offset?.[0] || 0)) / 2000,
        (interpolate(item.source.z, Z_ANCHORS) + (offset?.[1] || 0)) / 1675,
      ];
      let closest = null, distance = Infinity;
      for (const [suffix, polygon] of Object.entries(polygons)) {
        if (!polygon || polygon.length < 3) continue;
        const d = polygonDistance(point, polygon);
        if (d < distance) { closest = suffix; distance = d; }
      }
      // Reject common-area/roof/unregistered geometry instead of guessing.
      if (closest === null || distance > 0.025) continue;
      const unit = `${item.level}${closest.padStart(2, "0")}`;
      const polygon = polygons[closest];
      const centroid = polygon.reduce((sum, p) => [sum[0] + p[0] / polygon.length, sum[1] + p[1] / polygon.length], [0, 0]);
      item.normal = new THREE.Vector3(point[0] - centroid[0], 0, point[1] - centroid[1]).normalize();
      item.mesh.userData.fitteUnit = unit;
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
    if (changed && frame) frameWindows();
    if (changed && frame && (level === -1 || level === 0 || level === 9)) window.fitteModel?.reset();
  }

  canvas.addEventListener("pointerdown", (event) => { pointerStart = { x: event.clientX, y: event.clientY, button: event.button }; flight = null; });
  canvas.addEventListener("wheel", () => { flight = null; }, { passive: true });
  canvas.addEventListener("keydown", () => { flight = null; });
  canvas.addEventListener("pointercancel", () => { pointerStart = null; });
  canvas.addEventListener("pointerup", (event) => {
    const start = pointerStart;
    pointerStart = null;
    if (!start || start.button !== 0 || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) return;
    const bounds = canvas.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(model, true);
    const first = hits[0];
    if (!first) return;
    const windowHit = hits.find((hit) => hit.distance <= first.distance + 0.025 && hit.object.userData.fitteUnit);
    if (windowHit) window.fitteSelectUnit?.(windowHit.object.userData.fitteUnit);
  });

  return {
    sync,
    cancelFlight() { flight = null; },
    update(now) {
      if (!flight) return;
      const t = flight.duration ? Math.min(1, (now - flight.start) / flight.duration) : 1;
      const ease = t * t * (3 - 2 * t);
      camera.position.lerpVectors(flight.from, flight.position, ease);
      controls.target.lerpVectors(flight.fromTarget, flight.target, ease);
      if (t === 1) flight = null;
    },
  };
}
