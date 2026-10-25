/**
 * Placeholder floor plans for prototype 1.
 * Draws a double-loaded corridor plan from the fixture outlines and rasterizes
 * it to PNG at the pixel size each Floor row declares.
 *
 * Run: node scripts/gen-floors.ts
 */
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seed = JSON.parse(
  readFileSync(join(root, "fixtures/units.seed.json"), "utf8"),
);

type Pt = [number, number];
type SeedUnit = {
  floor_id: string;
  number: string;
  outline: Pt[];
  label_pos: Pt;
  bedrooms: { value: number };
  has_balcony: { value: boolean };
};
type SeedFloor = {
  id: string;
  image_url: string;
  width_px: number;
  height_px: number;
};

// Stroke weights read as 1 px hairlines once a 6600 px sheet is fit to a screen.
const W_EXT = 9;
const W_PART = 6;
const W_DOOR = 4;
const W_FIX = 3;

const lines: string[] = [];
let out = "";

function line(x1: number, y1: number, x2: number, y2: number, w: number) {
  out += `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke-width="${w}"/>`;
}

function rect(x: number, y: number, w: number, h: number, sw: number) {
  out += `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" stroke-width="${sw}"/>`;
}

function r(n: number) {
  return Math.round(n * 10) / 10;
}

/** Wall segment with a door opening at t (0..1) and a quarter-circle swing. */
function wallDoor(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  t: number,
  doorLen: number,
  swing: 1 | -1,
) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const c = len * t;
  const s0 = Math.max(0, c - doorLen / 2);
  const s1 = Math.min(len, c + doorLen / 2);
  line(ax, ay, ax + ux * s0, ay + uy * s0, W_PART);
  line(ax + ux * s1, ay + uy * s1, bx, by, W_PART);

  // hinge at s0, leaf rotated 90 degrees into the room on the swing side
  const hx = ax + ux * s0;
  const hy = ay + uy * s0;
  const nx = -uy * swing;
  const ny = ux * swing;
  const w = s1 - s0;
  line(hx, hy, hx + nx * w, hy + ny * w, W_DOOR);
  out += `<path d="M ${r(hx + ux * w)} ${r(hy + uy * w)} A ${r(w)} ${r(w)} 0 0 ${swing > 0 ? 0 : 1} ${r(hx + nx * w)} ${r(hy + ny * w)}" stroke-width="${W_FIX}"/>`;
}

function drawUnit(u: SeedUnit, W: number, H: number) {
  const xs = u.outline.map((p) => p[0]);
  const ys = u.outline.map((p) => p[1]);
  const x0 = Math.min(...xs) * W;
  const x1 = Math.max(...xs) * W;
  const y0 = Math.min(...ys) * H;
  const y1 = Math.max(...ys) * H;
  const width = x1 - x0;
  const depth = y1 - y0;
  const north = (y0 + y1) / 2 < H / 2;

  // local coordinates: u along the demising walls, v from the corridor outward
  const P = (lu: number, lv: number): Pt =>
    north ? [x0 + lu * width, y1 - lv * depth] : [x0 + lu * width, y0 + lv * depth];
  const seg = (a: Pt, b: Pt, w: number) => line(a[0], a[1], b[0], b[1], w);

  // unit boundary: demising walls and the two faces
  rect(x0, y0, width, depth, W_EXT);

  // entry, bathroom, service wall
  const sideWall = 0.3;
  const bathV = 0.46;
  seg(P(sideWall, 0), P(sideWall, bathV), W_PART);
  seg(P(0, 0.22), P(sideWall, 0.22), W_PART);
  seg(P(0, bathV), P(sideWall, bathV), W_PART);

  // entry door off the corridor
  const e = P(0.08, 0);
  const e2 = P(0.26, 0);
  wallDoor(e[0], e[1], e2[0], e2[1], 0.5, Math.abs(e2[0] - e[0]) * 0.9, north ? -1 : 1);

  // bathroom fixtures: tub against the demising wall, basin beside the door
  const tubA = P(0.03, 0.25);
  const tubB = P(0.16, 0.43);
  out += `<rect x="${r(Math.min(tubA[0], tubB[0]))}" y="${r(Math.min(tubA[1], tubB[1]))}" width="${r(Math.abs(tubB[0] - tubA[0]))}" height="${r(Math.abs(tubB[1] - tubA[1]))}" stroke-width="${W_FIX}"/>`;

  // bathroom door
  const bd1 = P(sideWall, 0.26);
  const bd2 = P(sideWall, 0.42);
  wallDoor(bd1[0], bd1[1], bd2[0], bd2[1], 0.5, Math.abs(bd2[1] - bd1[1]) * 0.9, 1);

  const beds = u.bedrooms.value;
  if (beds > 0) {
    const bandV = 0.54;
    const uStart = 0.32;
    const span = (1 - uStart) / beds;
    for (let i = 0; i < beds; i += 1) {
      const a = P(uStart + i * span, bandV);
      const b = P(uStart + (i + 1) * span, bandV);
      wallDoor(a[0], a[1], b[0], b[1], 0.3, width * span * 0.3, north ? 1 : -1);
      if (i > 0) {
        seg(P(uStart + i * span, bandV), P(uStart + i * span, 1), W_PART);
      }
      // bed block against the facade
      const ba = P(uStart + i * span + span * 0.18, 0.72);
      const bb = P(uStart + (i + 1) * span - span * 0.18, 0.95);
      out += `<rect x="${r(Math.min(ba[0], bb[0]))}" y="${r(Math.min(ba[1], bb[1]))}" width="${r(Math.abs(bb[0] - ba[0]))}" height="${r(Math.abs(bb[1] - ba[1]))}" stroke-width="${W_FIX}"/>`;
    }
    seg(P(uStart, bandV), P(uStart, 1), W_PART);
  } else {
    // studio: closet only
    const ca = P(0.32, 0.86);
    const cb = P(0.52, 1);
    out += `<rect x="${r(Math.min(ca[0], cb[0]))}" y="${r(Math.min(ca[1], cb[1]))}" width="${r(Math.abs(cb[0] - ca[0]))}" height="${r(Math.abs(cb[1] - ca[1]))}" stroke-width="${W_FIX}"/>`;
  }

  // kitchen counter along the demising wall, corridor side of the living area
  const ka = P(0.34, 0.1);
  const kb = P(0.72, 0.2);
  out += `<rect x="${r(Math.min(ka[0], kb[0]))}" y="${r(Math.min(ka[1], kb[1]))}" width="${r(Math.abs(kb[0] - ka[0]))}" height="${r(Math.abs(kb[1] - ka[1]))}" stroke-width="${W_FIX}"/>`;

  // windows on the facade: three openings drawn as a thin inner line
  const facadeY = north ? y0 : y1;
  const inset = north ? 26 : -26;
  for (let i = 0; i < 3; i += 1) {
    const wx0 = x0 + width * (0.12 + i * 0.3);
    const wx1 = wx0 + width * 0.2;
    line(wx0, facadeY + inset, wx1, facadeY + inset, W_FIX);
  }

  // balcony
  if (u.has_balcony.value) {
    const by0 = north ? y0 - H * 0.075 : y1;
    const bh = H * 0.075;
    rect(x0 + width * 0.12, by0, width * 0.76, bh, W_PART);
  }

  // unit number
  const lx = u.label_pos[0] * W;
  const ly = u.label_pos[1] * H;
  lines.push(
    `<text x="${r(lx)}" y="${r(ly)}" font-family="monospace" font-size="150" text-anchor="middle" fill="#000" stroke="none">${u.number}</text>`,
  );
}

function drawFloor(floor: SeedFloor, units: SeedUnit[]) {
  const W = floor.width_px;
  const H = floor.height_px;
  out = "";
  lines.length = 0;

  const xs = units.flatMap((u) => u.outline.map((p) => p[0]));
  const ys = units.flatMap((u) => u.outline.map((p) => p[1]));
  const bx0 = Math.min(...xs) * W;
  const bx1 = Math.max(...xs) * W;
  const by0 = Math.min(...ys) * H;
  const by1 = Math.max(...ys) * H;

  // outer face of the exterior wall
  rect(bx0 - 26, by0 - 26, bx1 - bx0 + 52, by1 - by0 + 52, W_EXT);

  // corridor: the band between the two unit rows
  const northBottom = Math.max(
    ...units
      .filter((u) => u.label_pos[1] < 0.5)
      .flatMap((u) => u.outline.map((p) => p[1])),
  );
  const southTop = Math.min(
    ...units
      .filter((u) => u.label_pos[1] >= 0.5)
      .flatMap((u) => u.outline.map((p) => p[1])),
  );
  line(bx0, northBottom * H, bx1, northBottom * H, W_EXT);
  line(bx0, southTop * H, bx1, southTop * H, W_EXT);

  // stair runs at both ends of the corridor
  const cTop = northBottom * H;
  const cBot = southTop * H;
  for (const side of [0, 1]) {
    const sx = side === 0 ? bx0 + 40 : bx1 - 40 - 420;
    rect(sx, cTop + 24, 420, cBot - cTop - 48, W_PART);
    for (let i = 1; i < 7; i += 1) {
      line(sx + (420 / 7) * i, cTop + 24, sx + (420 / 7) * i, cBot - 24, W_FIX);
    }
  }

  for (const u of units) drawUnit(u, W, H);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect x="0" y="0" width="${W}" height="${H}" fill="#fff" stroke="none"/>
<g fill="none" stroke="#000" stroke-linecap="square">${out}</g>
${lines.join("")}
</svg>`;

  return svg;
}

const floors = seed.floors as SeedFloor[];
for (const floor of floors) {
  const units = (seed.units as SeedUnit[]).filter((u) => u.floor_id === floor.id);
  const svg = drawFloor(floor, units);
  const target = join(root, "public", floor.image_url);
  mkdirSync(dirname(target), { recursive: true });
  await sharp(Buffer.from(svg), { density: 72 })
    .resize(floor.width_px, floor.height_px)
    .png({ compressionLevel: 9 })
    .toFile(target);
  console.log(`${target}  ${floor.width_px}x${floor.height_px}  ${units.length} units`);
}
