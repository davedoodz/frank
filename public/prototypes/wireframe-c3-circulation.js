/* Spatial references traced from the issued 2000 × 1675 floor crops.
   Not measured CAD boundaries; the schedule's 15% remains an estimate.
   Level 2's double-height void is excluded. Level 8 ends at its stair. */
const circulationTypical = [[498,1128],[530,1128],[530,870],[636,764],[636,600],[750,600],[790,550],[1270,550],[1270,516],[785,516],[733,568],[600,568],[600,645],[600,734],[590,752],[498,844]];
const circulationStairs = [
  [[530,1014],[650,1014],[650,1060],[530,1060]],
  [[1124,550],[1244,550],[1244,602],[1124,602]],
  [[482,688],[600,688],[600,734],[482,734]],
];
const circulationGround = [
  [[559,615],[740,615],[740,740],[585,740],[585,781],[508,781],[508,742],[441,742],[441,700],[559,700]],
  [[585,740],[630,740],[630,795],[700,795],[700,875],[675,875],[675,805],[585,805]],
  [[467,997],[610,997],[610,1069],[467,1069]],
  [[1077,556],[1205,556],[1205,337],[1230,337],[1230,610],[1077,610]],
];
function circulationPolys(level) {
  if (level === 1) return circulationGround;
  if (level < 2 || level > 8) return [];
  const corridor = level === 8
    ? circulationTypical.map(([x, y]) => [x, y === 1128 ? 1060 : y])
    : circulationTypical;
  return [corridor, ...circulationStairs];
}
function circulationSelected() {
  return V.sel["Unités"] === -1 && V.circulationLevel === paneLevel();
}
function circulationMarkHTML() {
  return `<g class="circulation ${circulationSelected() ? "selected" : ""}" data-act="circulation"><title>Circulation</title>${circulationPolys(paneLevel()).map(poly => `<polygon points="${poly.map(([x,y]) => `${x/2000},${y/1675}`).join(" ")}" style="stroke-width:${1.6/(V.zoom/100)}px"></polygon>`).join("")}</g>`;
}
function circulationRowHTML(row, cell) {
  return `<tr class="${circulationSelected() ? "on" : ""}" data-act="circulation"><td colspan="2"><button type="button" data-act="circulation" aria-pressed="${circulationSelected()}">Circulation</button></td>${row.slice(2).map((c,j) => cell(c,j+2)).join("")}</tr>`;
}
function selectCirculation() {
  V.circulationLevel = paneLevel();
  stopGlide();
  V.sel["Unités"] = -1;
  V.zoom = 100;
  V.pan = { x: 0, y: 0 };
  render();
}
function paintCirculationHover(target) {
  const hover = !!target?.closest?.('[data-act="circulation"]');
  document.querySelectorAll('.circulation').forEach(el => el.classList.toggle('hover', hover));
  document.querySelectorAll('tr[data-act="circulation"]').forEach(el => el.classList.toggle('circulation-hover', hover));
}
for (const event of ['pointerover', 'focusin']) document.addEventListener(event, e => paintCirculationHover(e.target));
for (const event of ['pointerout', 'focusout']) document.addEventListener(event, e => paintCirculationHover(e.relatedTarget));
const circulationStyle = document.createElement('style');
circulationStyle.textContent = `
.umark .circulation polygon{fill:transparent;stroke:none;pointer-events:all;cursor:pointer;vector-effect:non-scaling-stroke}
.umark .circulation.hover polygon{fill:rgba(139,160,15,.12);stroke:#8ba00f}
.umark .circulation.selected polygon{fill:rgba(139,160,15,.22);stroke:#8ba00f}
.vp.drag .circulation:not(.selected) polygon{fill:transparent;stroke:none}
.tbl tr[data-act="circulation"]{cursor:pointer}
.tbl tr.circulation-hover td{background:#f3f5e9}
.plan.align::before,.plan canvas.sheetpdf{pointer-events:none}
.tbl tr[data-act="circulation"] button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
`;
document.head.append(circulationStyle);
