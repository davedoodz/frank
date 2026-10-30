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
    const response = await fetch(url, { cache: "no-cache" });
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

function tileRange(manifest, level, x0, x1, y0, y1) {
  const overscan = manifest.tileSize;
  const firstColumn = Math.max(0, Math.floor((x0 - overscan) / manifest.tileSize));
  const lastColumn = Math.min(level.columns - 1, Math.floor((x1 + overscan) / manifest.tileSize));
  const firstRow = Math.max(0, Math.floor((y0 - overscan) / manifest.tileSize));
  const lastRow = Math.min(level.rows - 1, Math.floor((y1 + overscan) / manifest.tileSize));
  const tiles = [];
  for (let row = firstRow; row <= lastRow; row++) {
    for (let column = firstColumn; column <= lastColumn; column++) tiles.push({ column, row });
  }
  return tiles;
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
  const logicalHeight = side ? rect.width : rect.height;
  const zoom = Number(plan.style.transform.match(/scale\(([\d.]+)\)/)?.[1] || 1);
  const targetWidth = logicalWidth * (window.devicePixelRatio || 1) * 1.5;
  const level = zoom >= 1.2
    ? manifest.levels.at(-1)
    : manifest.levels.find((entry) => entry.width >= targetWidth) || manifest.levels.at(-1);
  if (!level) return null;

  const [p0x, p0y] = localPoint(turn, rect, left, top);
  const [p1x, p1y] = localPoint(turn, rect, right, bottom);
  const x0 = Math.max(0, Math.min(p0x, p1x) / logicalWidth * level.width);
  const x1 = Math.min(level.width, Math.max(p0x, p1x) / logicalWidth * level.width);
  const y0 = Math.max(0, Math.min(p0y, p1y) / logicalHeight * level.height);
  const y1 = Math.min(level.height, Math.max(p0y, p1y) / logicalHeight * level.height);
  return { level, tiles: tileRange(manifest, level, x0, x1, y0, y1) };
}

function tileUrl(manifest, level, column, row) {
  const tilePath = manifest.tilePath ? `/${manifest.tilePath}` : "";
  return `${manifest.baseUrl}${tilePath}/${level.level}/${column}_${row}.webp`;
}

function tileLayer(plan) {
  let layer = plan.querySelector(":scope > .supabase-tiles");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "supabase-tiles";
    plan.append(layer);
  }
  return layer;
}

function placeTile(image, manifest, level, column, row) {
  Object.assign(image.style, {
    left: `${column * manifest.tileSize / level.width * 100}%`,
    top: `${row * manifest.tileSize / level.height * 100}%`,
    width: `${Math.min(manifest.tileSize, level.width - column * manifest.tileSize) / level.width * 100}%`,
    height: `${Math.min(manifest.tileSize, level.height - row * manifest.tileSize) / level.height * 100}%`,
  });
}

async function paint(plan, manifest, request) {
  if (!plan.isConnected || !request.tiles.length) return;
  const layer = tileLayer(plan);
  const levelKey = String(request.level.level);
  const images = request.tiles.map(({ column, row }) => {
    const key = `${levelKey}/${column}_${row}`;
    let image = layer.querySelector(`img[data-tile="${key}"]`);
    if (image) return image;
    image = new Image();
    image.decoding = "async";
    image.fetchPriority = "high";
    image.alt = "";
    image.dataset.tile = key;
    image.dataset.level = levelKey;
    placeTile(image, manifest, request.level, column, row);
    image.src = tileUrl(manifest, request.level, column, row);
    layer.append(image);
    return image;
  });

  await Promise.all(images.map((image) => image.decode().catch(() => null)));
  if (!plan.isConnected || images.some((image) => !image.complete || image.naturalWidth === 0)) return;
  plan.dataset.supabaseTiles = "ready";
  for (const image of layer.querySelectorAll("img[data-level]")) {
    if (image.dataset.level !== levelKey) image.remove();
  }
  const canvas = plan.querySelector("canvas[data-sheetpdf]");
  if (canvas) {
    canvas.dataset.supabaseTiles = "ready";
    canvas.style.visibility = "hidden";
  }
}

function prewarm(plan, manifest, viewport) {
  if (!window.requestIdleCallback || !plan.isConnected) return;
  window.requestIdleCallback(() => {
    if (!plan.isConnected) return;
    const level = manifest.levels.at(-1);
    const baseWidth = Number(plan.dataset.tileBaseWidth);
    const baseHeight = Number(plan.dataset.tileBaseHeight);
    if (!level || !baseWidth || !baseHeight) return;
    const zoom = 3.05;
    const halfWidth = Math.min(0.5, viewport.width / (baseWidth * zoom) / 2);
    const halfHeight = Math.min(0.5, viewport.height / (baseHeight * zoom) / 2);
    const tiles = tileRange(
      manifest,
      level,
      (0.5 - halfWidth) * level.width,
      (0.5 + halfWidth) * level.width,
      (0.5 - halfHeight) * level.height,
      (0.5 + halfHeight) * level.height,
    );
    for (const { column, row } of tiles) {
      const image = new Image();
      image.fetchPriority = "low";
      image.src = tileUrl(manifest, level, column, row);
    }
  }, { timeout: 1200 });
}

async function schedule() {
  const viewport = document.querySelector("[data-vp]");
  const plan = viewport?.querySelector("[data-plan-pdf]");
  if (!viewport || !plan) return;
  const pdfUrl = plan.dataset.planPdf;
  const manifest = await manifestFor(pdfUrl);
  const currentViewport = document.querySelector("[data-vp]");
  const currentPlan = currentViewport?.querySelector(`[data-plan-pdf="${CSS.escape(pdfUrl)}"]`);
  if (!manifest || !currentViewport || !currentPlan) return;
  const request = visibleTiles(
    currentPlan,
    manifest,
    currentViewport.getBoundingClientRect(),
    Number(currentViewport.dataset.turn || 0),
  );
  if (request) void paint(currentPlan, manifest, request);
  if (request?.level.level !== manifest.levels.at(-1)?.level) {
    prewarm(currentPlan, manifest, currentViewport.getBoundingClientRect());
  }
}

function queue() {
  clearTimeout(timer);
  timer = setTimeout(() => void schedule(), 40);
}

window.addEventListener("fitte:plan-paint", queue);
window.addEventListener("fitte:render", () => queueMicrotask(queue));
window.addEventListener("resize", queue);
queue();
