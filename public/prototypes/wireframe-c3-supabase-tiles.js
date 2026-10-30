const manifests = new Map();
let storageConfig;
let timer;

async function config() {
  if (storageConfig !== undefined) return storageConfig;
  try {
    const response = await fetch("/api/storage-config");
    storageConfig = response.ok ? await response.json() : null;
  } catch {
    storageConfig = null;
  }
  return storageConfig;
}

function drawingName(pdfUrl) {
  const path = new URL(pdfUrl, window.location.href).pathname;
  return path.split("/").pop()?.replace(/\.pdf$/i, "") || null;
}

async function manifestFor(pdfUrl) {
  if (manifests.has(pdfUrl)) return manifests.get(pdfUrl);
  const pending = (async () => {
    const settings = await config();
    const drawing = drawingName(pdfUrl);
    if (!settings?.tileBaseUrl || !drawing) return null;
    const url = `${settings.tileBaseUrl}/baldwin-iii/${encodeURIComponent(drawing)}/manifest.json`;
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) return null;
    return { ...(await response.json()), baseUrl: url.slice(0, url.lastIndexOf("/")) };
  })();
  manifests.set(pdfUrl, pending);
  const manifest = await pending;
  manifests.set(pdfUrl, manifest);
  return manifest;
}

function localPoint(turn, rect, x, y) {
  if (turn === 90) return [y - rect.top, rect.right - x];
  if (turn === 180) return [rect.right - x, rect.bottom - y];
  if (turn === 270) return [rect.bottom - y, x - rect.left];
  return [x - rect.left, y - rect.top];
}

function visibleTiles(plan, manifest, viewport, turn) {
  const rect = plan.getBoundingClientRect();
  const left = Math.max(rect.left, viewport.left);
  const top = Math.max(rect.top, viewport.top);
  const right = Math.min(rect.right, viewport.right);
  const bottom = Math.min(rect.bottom, viewport.bottom);
  if (right <= left || bottom <= top) return null;

  const side = turn === 90 || turn === 270;
  const logicalWidth = side ? rect.height : rect.width;
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = logicalWidth * dpr;
  const level = manifest.levels.find((entry) => entry.width >= targetWidth) || manifest.levels.at(-1);
  if (!level) return null;

  const [p0x, p0y] = localPoint(turn, rect, left, top);
  const [p1x, p1y] = localPoint(turn, rect, right, bottom);
  const x0 = Math.max(0, Math.min(p0x, p1x) / logicalWidth * level.width);
  const x1 = Math.min(level.width, Math.max(p0x, p1x) / logicalWidth * level.width);
  const logicalHeight = side ? rect.width : rect.height;
  const y0 = Math.max(0, Math.min(p0y, p1y) / logicalHeight * level.height);
  const y1 = Math.min(level.height, Math.max(p0y, p1y) / logicalHeight * level.height);
  const overscan = manifest.tileSize;
  const firstColumn = Math.max(0, Math.floor((x0 - overscan) / manifest.tileSize));
  const lastColumn = Math.min(level.columns - 1, Math.floor((x1 + overscan) / manifest.tileSize));
  const firstRow = Math.max(0, Math.floor((y0 - overscan) / manifest.tileSize));
  const lastRow = Math.min(level.rows - 1, Math.floor((y1 + overscan) / manifest.tileSize));
  const tiles = [];
  for (let row = firstRow; row <= lastRow; row++) {
    for (let column = firstColumn; column <= lastColumn; column++) tiles.push({ column, row });
  }
  return { level, tiles };
}

function tileLayer(plan) {
  let layer = plan.querySelector(":scope > .supabase-tiles");
  if (layer) return layer;
  layer = document.createElement("div");
  layer.className = "supabase-tiles";
  plan.append(layer);
  return layer;
}

function paint(plan, manifest, request) {
  const layer = tileLayer(plan);
  const wanted = new Set();
  for (const { column, row } of request.tiles) {
    const key = `${request.level.level}/${column}_${row}`;
    wanted.add(key);
    let image = layer.querySelector(`img[data-tile="${key}"]`);
    if (image) continue;
    image = new Image();
    image.decoding = "async";
    image.alt = "";
    image.dataset.tile = key;
    image.src = `${manifest.baseUrl}/${request.level.level}/${column}_${row}.webp`;
    Object.assign(image.style, {
      left: `${column * manifest.tileSize / request.level.width * 100}%`,
      top: `${row * manifest.tileSize / request.level.height * 100}%`,
      width: `${Math.min(manifest.tileSize, request.level.width - column * manifest.tileSize) / request.level.width * 100}%`,
      height: `${Math.min(manifest.tileSize, request.level.height - row * manifest.tileSize) / request.level.height * 100}%`,
    });
    layer.append(image);
  }
  for (const image of layer.querySelectorAll("img[data-tile]")) {
    if (!wanted.has(image.dataset.tile)) image.remove();
  }
  const canvas = plan.querySelector("canvas[data-sheetpdf]");
  if (canvas) {
    canvas.dataset.supabaseTiles = "ready";
    canvas.dataset.pdfState = "ready";
    canvas.style.visibility = "hidden";
  }
}

async function schedule() {
  const viewport = document.querySelector("[data-vp]");
  if (!viewport) return;
  const bounds = viewport.getBoundingClientRect();
  const turn = Number(viewport.dataset.turn || 0);
  for (const plan of viewport.querySelectorAll("[data-plan-pdf]")) {
    const manifest = await manifestFor(plan.dataset.planPdf);
    if (!manifest) continue;
    const request = visibleTiles(plan, manifest, bounds, turn);
    if (request) paint(plan, manifest, request);
  }
}

function queue() {
  clearTimeout(timer);
  timer = setTimeout(() => void schedule(), 80);
}

window.addEventListener("fitte:plan-paint", queue);
window.addEventListener("fitte:render", () => queueMicrotask(queue));
window.addEventListener("resize", queue);
queue();
