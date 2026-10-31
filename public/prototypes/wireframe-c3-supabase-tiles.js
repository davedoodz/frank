// Every drawing in the plan pane — the architect's floor and each consultant
// sheet laid over it — is read from a pre-rendered tile pyramid when one has
// been published. pdf.js only runs for a sheet with no pyramid.
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
    try {
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) return null;
      return { ...(await response.json()), baseUrl: url.slice(0, url.lastIndexOf("/")) };
    } catch {
      return null;
    }
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

function planZoom(host) {
  const plan = host.closest(".plan") || host;
  return Number(plan.style.transform.match(/scale\(([\d.]+)\)/)?.[1] || 1);
}

/* The surveyor's sheet is shown upside down: its box is turned a half turn
   by CSS, so the part of it on screen is read back into the sheet's own
   axes the same way pdf.js does for that canvas. */
function visibleTiles(host, manifest, viewport, turn, halfTurn) {
  const rect = host.getBoundingClientRect();
  const left = Math.max(rect.left, viewport.left);
  const top = Math.max(rect.top, viewport.top);
  const right = Math.min(rect.right, viewport.right);
  const bottom = Math.min(rect.bottom, viewport.bottom);
  if (right <= left || bottom <= top || rect.width < 1 || rect.height < 1) return null;

  const side = turn === 90 || turn === 270;
  const logicalWidth = side ? rect.height : rect.width;
  const logicalHeight = side ? rect.width : rect.height;
  const targetWidth = logicalWidth * (window.devicePixelRatio || 1) * 1.5;
  const level = planZoom(host) >= 1.2
    ? manifest.levels.at(-1)
    : manifest.levels.find((entry) => entry.width >= targetWidth) || manifest.levels.at(-1);
  if (!level) return null;

  const [p0x, p0y] = localPoint(turn, rect, left, top);
  const [p1x, p1y] = localPoint(turn, rect, right, bottom);
  let vx0 = Math.min(p0x, p1x), vx1 = Math.max(p0x, p1x);
  let vy0 = Math.min(p0y, p1y), vy1 = Math.max(p0y, p1y);
  if (halfTurn) {
    [vx0, vx1, vy0, vy1] = [logicalWidth - vx1, logicalWidth - vx0, logicalHeight - vy1, logicalHeight - vy0];
  }
  const x0 = Math.max(0, vx0 / logicalWidth * level.width);
  const x1 = Math.min(level.width, vx1 / logicalWidth * level.width);
  const y0 = Math.max(0, vy0 / logicalHeight * level.height);
  const y1 = Math.min(level.height, vy1 / logicalHeight * level.height);
  return { level, tiles: tileRange(manifest, level, x0, x1, y0, y1) };
}

function tileUrl(manifest, level, column, row) {
  const tilePath = manifest.tilePath ? `/${manifest.tilePath}` : "";
  return `${manifest.baseUrl}${tilePath}/${level.level}/${column}_${row}.webp`;
}

function tileLayer(host) {
  let layer = host.querySelector(":scope > .supabase-tiles");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "supabase-tiles";
    host.append(layer);
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

async function paint(host, manifest, request) {
  if (!host.isConnected || !request.tiles.length) return;
  const layer = tileLayer(host);
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
  if (!host.isConnected || images.some((image) => !image.complete || image.naturalWidth === 0)) return;
  host.dataset.supabaseTiles = "ready";
  for (const image of layer.querySelectorAll("img[data-level]")) {
    if (image.dataset.level !== levelKey) image.remove();
  }
}

/* Fetch the sharpest level around the middle of the sheet while nothing
   else is happening, so the first zoom past fit lands on cached tiles. */
function prewarm(host, manifest, viewport) {
  if (!window.requestIdleCallback || !host.isConnected) return;
  window.requestIdleCallback(() => {
    if (!host.isConnected) return;
    const level = manifest.levels.at(-1);
    const fitWidth = host.offsetWidth, fitHeight = host.offsetHeight;
    if (!level || !fitWidth || !fitHeight) return;
    const zoom = 3.05;
    const halfWidth = Math.min(0.5, viewport.width / (fitWidth * zoom) / 2);
    const halfHeight = Math.min(0.5, viewport.height / (fitHeight * zoom) / 2);
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

/* A sheet box is the floor plan ([data-plan-pdf]) or a consultant layer
   ([data-sheet-pdf]). Its state tells pdf.js whether to stay out of it:
   "pending" while the pyramid is looked up, "ready" once tiles cover it,
   "none" when no pyramid was published. */
async function paintSheet(host) {
  const url = host.dataset.planPdf || host.dataset.sheetPdf;
  if (!url) return;
  if (!host.dataset.supabaseTiles) host.dataset.supabaseTiles = "pending";
  const manifest = await manifestFor(url);
  if (!host.isConnected) return;
  if (!manifest) {
    if (host.dataset.supabaseTiles !== "none") {
      host.dataset.supabaseTiles = "none";
      window.dispatchEvent(new Event("fitte:tiles-missing"));
    }
    return;
  }
  const viewport = host.closest("[data-vp]");
  if (!viewport) return;
  const bounds = viewport.getBoundingClientRect();
  const request = visibleTiles(host, manifest, bounds, Number(viewport.dataset.turn || 0),
    host.dataset.pdfTurn === "180");
  if (request) await paint(host, manifest, request);
  if (request && request.level.level !== manifest.levels.at(-1)?.level) prewarm(host, manifest, bounds);
}

function schedule() {
  const viewport = document.querySelector("[data-vp]");
  if (!viewport) return;
  for (const host of viewport.querySelectorAll("[data-plan-pdf], .lay[data-sheet-pdf]")) void paintSheet(host);
}

function queue() {
  clearTimeout(timer);
  timer = setTimeout(schedule, 40);
}

window.addEventListener("fitte:plan-paint", queue);
window.addEventListener("fitte:render", () => queueMicrotask(queue));
window.addEventListener("resize", queue);
queue();
