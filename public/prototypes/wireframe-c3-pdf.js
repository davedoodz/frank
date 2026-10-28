import * as pdfjs from "./vendor/pdfjs/pdf.min.mjs";

pdfjs.GlobalWorkerOptions.workerSrc = "./vendor/pdfjs/pdf.worker.min.mjs";

// Render only the visible part at device-pixel resolution. A 600% zoom must
// not stretch a fixed bitmap or allocate a canvas six times the whole sheet.
const documents = new Map();
const tiles = new Map();
const failures = new Set();
let wanted = new Map();
let signature = "";
let timer;
let busy = false;

function requestFor(canvas, viewport) {
  const rect = canvas.parentElement.getBoundingClientRect();
  const left = Math.max(rect.left, viewport.left);
  const top = Math.max(rect.top, viewport.top);
  const right = Math.min(rect.right, viewport.right);
  const bottom = Math.min(rect.bottom, viewport.bottom);
  if (right <= left || bottom <= top || rect.width < 1 || rect.height < 1) return null;
  const dpr = window.devicePixelRatio || 1;
  const width = Math.ceil(rect.width * dpr);
  const height = Math.ceil(rect.height * dpr);
  const turned = canvas.dataset.pdfTurn === "180";
  // Source coordinates run backwards inside the surveyor's rotated sheet.
  const x0 = (turned ? rect.right - right : left - rect.left) * dpr;
  const y0 = (turned ? rect.bottom - bottom : top - rect.top) * dpr;
  const x1 = (turned ? rect.right - left : right - rect.left) * dpr;
  const y1 = (turned ? rect.bottom - top : bottom - rect.top) * dpr;
  const x = Math.max(0, Math.floor((x0 - 128) / 256) * 256);
  const y = Math.max(0, Math.floor((y0 - 128) / 256) * 256);
  const w = Math.min(width, Math.ceil((x1 + 128) / 256) * 256) - x;
  const h = Math.min(height, Math.ceil((y1 + 128) / 256) * 256) - y;
  const url = canvas.dataset.pdfUrl;
  const slot = canvas.hasAttribute("data-sheetpdf") ? "floor" : canvas.dataset.laypdf;
  return { slot, canvas, url, width, height, x, y, w, h,
    key: [url, width, height, x, y, w, h].join(":") };
}

function paint(request, bitmap) {
  const canvas = request.canvas;
  if (canvas.dataset.pdfKey === request.key) return;
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  Object.assign(canvas.style, {
    left: `${request.x / request.width * 100}%`,
    top: `${request.y / request.height * 100}%`,
    width: `${request.w / request.width * 100}%`,
    height: `${request.h / request.height * 100}%`,
    right: "auto", bottom: "auto",
  });
  canvas.getContext("2d").drawImage(bitmap, 0, 0);
  canvas.dataset.ready = "1";
  canvas.dataset.pdfState = "ready";
  canvas.dataset.pdfKey = request.key;
}

function showStatus() {
  const pane = document.querySelector("[data-vp]")?.closest(".pane");
  if (!pane) return;
  const floor = wanted.get("floor");
  pane.dataset.pdf = !floor ? "" : failures.has(floor.url) ? "error"
    : tiles.has(floor.key) ? "" : "busy";
}

async function pageFor(url) {
  let doc = documents.get(url);
  if (!doc) doc = await pdfjs.getDocument(url).promise;
  documents.delete(url);
  documents.set(url, doc);
  // All visible disciplines must stay resident; evicting one of seven active
  // layers would force it to be parsed again on every viewport change.
  const visible = new Set([...wanted.values()].map((r) => r.url));
  while (documents.size > Math.max(3, visible.size)) {
    const oldest = [...documents.keys()].find((key) => !visible.has(key));
    if (oldest === undefined) break;
    const previous = documents.get(oldest);
    documents.delete(oldest);
    await previous.destroy();
  }
  return doc.getPage(1);
}

async function pump() {
  if (busy) return;
  const request = [...wanted.values()].find((r) => !tiles.has(r.key) && !failures.has(r.url));
  if (!request) { showStatus(); return; }
  busy = true;
  try {
    const page = await pageFor(request.url);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: request.width / base.width });
    const off = document.createElement("canvas");
    off.width = request.w;
    off.height = request.h;
    await page.render({ canvasContext: off.getContext("2d"), viewport,
      transform: [1, 0, 0, 1, -request.x, -request.y] }).promise;
    const bitmap = await createImageBitmap(off);
    off.width = off.height = 0;
    tiles.set(request.key, bitmap);
    const visible = new Set([...wanted.values()].map((r) => r.key));
    while (tiles.size > Math.max(6, visible.size)) {
      const oldest = [...tiles.keys()].find((key) => !visible.has(key));
      if (oldest === undefined) break;
      tiles.get(oldest).close();
      tiles.delete(oldest);
    }
    const live = wanted.get(request.slot);
    if (live?.key === request.key && live.canvas.isConnected) paint(live, bitmap);
  } catch (error) {
    failures.add(request.url);
    console.error("Unable to render source PDF", request.url, error);
    const live = wanted.get(request.slot);
    if (live?.url === request.url) live.canvas.dataset.pdfState = "error";
  } finally {
    busy = false;
    showStatus();
    // Always pick the latest floor/zoom, not a queued obsolete viewport.
    void pump();
  }
}

function schedule() {
  const viewport = document.querySelector("[data-vp]");
  const next = new Map();
  if (viewport) {
    const bounds = viewport.getBoundingClientRect();
    for (const canvas of viewport.querySelectorAll("canvas[data-pdf-url]")) {
      const request = requestFor(canvas, bounds);
      if (!request) continue;
      next.set(request.slot, request);
      const bitmap = tiles.get(request.key);
      if (bitmap) {
        tiles.delete(request.key);
        tiles.set(request.key, bitmap);
        paint(request, bitmap);
      } else {
        canvas.dataset.pdfState = failures.has(request.url) ? "error" : "loading";
      }
    }
  }
  wanted = next;
  showStatus();
  const nextSignature = [...next.values()].map((r) => r.key).join("|");
  if (signature === nextSignature) return;
  signature = nextSignature;
  clearTimeout(timer);
  timer = setTimeout(() => void pump(), 120);
}

window.addEventListener("fitte:plan-paint", schedule);
window.addEventListener("fitte:render", () => queueMicrotask(schedule));
window.addEventListener("resize", schedule);
schedule();
