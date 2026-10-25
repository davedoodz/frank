# PRD.md: fitte

Status: active. Prototype 1 ship target: Sunday 2026-10-25, by 02:00. Test: Monday 2026-10-26 at the office, two technicians.

Read CONTEXT.md first. Section 4 is prototype 1 in full. Sections 11 and 12 specify prototype 2 and 3 so the schema and the routes are built for them tonight.

---

## 1. Goal, prototype 1

Unit DNA exists on the web. For one real project, one or two floors, every unit is a verified or unverified record attached to its outline on the plan. A technician clicks a unit and reads its data, or reads the schedule and finds its unit, in under 10 seconds.

## 2. Success criteria for Monday

1. One real project with at least 10 units across one or two floors is in fitte before the test, with every unit outlined on its plan.
2. Both technicians complete 3 timed tasks in fitte.
3. Median time in fitte is lower than median time with the current method (open the DWG or PDF, read the plan, open the Excel).
4. fitte's unit schedule is compared line by line to the technicians' own Excel for the same floors. The mismatch count is recorded. Any number is fine. The number is the point.
5. Each technician is shown the planned AutoCAD palette as a paper sketch or a rough frame and asked one question: would you use this inside AutoCAD, and what is missing. The answer shapes prototype 2.

## 3. The Monday test

Testers: the two technicians. 25 minutes each, back to back.

Before the test: ask them to bring the current unit schedule Excel for the test project.

1. Explain fitte in one sentence. Do not demo it.
2. Task A, baseline. "What is the net area and type of unit [real number]?" Current method. Time it.
3. Task B, baseline. "How many two-bedroom units are on floor [real floor]?" Time it.
4. Task C, baseline. "Which units on this floor have a balcony over 8 m²?" Time it. Swap for a question they actually get asked.
5. Repeat A, B, C in fitte. Time each. Do not help. Note where they hesitate and what they click first.
6. Open the schedule beside their Excel. Go line by line for one floor. Count mismatches. For each, ask which is right and why.
7. Show the AutoCAD palette sketch. Ask: would you use this inside AutoCAD? What is missing?
8. Two questions: what did it get wrong, and if this worked perfectly, what would you want next.
9. Write notes within 10 minutes, before the next person.

Record screen and audio only with consent. Photos of the office, the plans, the Excel, and a real AutoCAD session with the palette area visible are needed for the deck and for the simulated screens. Ask for those too.

## 4. Scope, prototype 1

### Must (ship tonight)

**M1. Data in.**
- One real project. One or two floors. 10 to 20 units.
- Each floor has a plan image: the floor plan sheet rasterized at 200 dpi from PDF, or rendered from DXF, title block masked.
- Each unit has an outline polygon in normalized coordinates on its floor image, a label position, the record fields in section 6, and `status: unverified` unless a technician confirmed it.
- Paths, in order of preference:
  1. **DXF parse.** `scripts/import/dxf.py` with `ezdxf`. Closed polylines on the unit-boundary layer become outlines. Text or block attributes inside them become unit numbers. Areas are computed from geometry. Fields the DXF does not carry (type, bedrooms, orientation, balcony) are typed in the seed or extracted by a vision model from the rasterized plan.
  2. **Vision extraction.** `scripts/import/vision.ts`. Send the rasterized floor to a vision language model. Ask for a list of units with number, approximate polygon, and the text fields readable on the plan. Confidence per field.
  3. **Manual.** Type the records into `fixtures/units.seed.json` from the plan and the Excel. Draw outlines with a 20-minute admin page at `/admin/outline` that lets you click points on the floor image and copies the polygon JSON.
- The path used is recorded per project in `Project.ingest_method`. The deck reports it.
- `scripts/seed.ts` loads the JSON into the database.

**M2. Project dashboard, route `/`.**
- Projects as a dense list, not cards: display name, code, city, year, floors, units, verified count, last import date. Click opens the project.
- A `+ new project` action that opens a minimal form (display name, code, city, floors) and creates an empty project. No file connection tonight. The connect step is a simulated panel in prototype 2.
- Project workspace tabs across the top bar once inside a project: `units`, `office dna`, `drawings`, `building`. Only `units` is live tonight. The other three render a one-line placeholder in `--ink-3`: `available in a later round`. No illustration.

**M3. Unit DNA, plan view, route `/p/[project]/units?floor=5&u=502`.**
- Left rail, 200 px: building navigation. Floors as a vertical list, each expandable to its unit numbers. Current floor and current unit marked. `all units` entry at the top.
- Center: the floor plan fills the remaining width. Pan by drag, zoom by scroll, 1x to 6x. Linework stays crisp.
- Unit outlines drawn on the plan: 1 px `--line` at rest, `--ink` on hover, 1.5 px `--accent` with an 8 percent `--accent` fill when selected. Verified units: rest stroke `--ink`. Unit number as a small monospace label at the label position.
- Click a unit to select. Click the background to clear. Arrow keys move the selection to the nearest unit in that direction. Escape clears.
- Right panel, 360 px: unit number, status (`verified` or `unverified`), type (Quebec count), bedrooms, bathrooms, rooms count, net area m² and ft², gross area if known, balcony (yes or no, area), floor, orientation, corner flag, sheet number, revision date, source file, project code. Each extracted field shows its confidence. Fields under 0.7 render muted with a dotted underline. Hover shows the number.
- Panel footer: two actions, `find similar units` and `edit`. Both disabled tonight with a tooltip `round 3` and `round 2`. They exist so the layout does not shift later.
- `all units` view: zoomed to fit, every unit filled with its typology color at 12 percent, legend in the panel, summary metrics above the plan (unit count, verified count, distribution by type).
- Selection and floor in the URL, so a link opens on a unit. This is the target of every simulated handoff later.

**M4. Unit schedule, route `/p/[project]/schedule`.**
- One dense table. Every unit in the project. Columns: number, floor, status, type, bedrooms, bathrooms, rooms, net m², net ft², gross m², orientation, corner, balcony, balcony m², sheet, revision. Numbers in monospace, right-aligned.
- Group by floor with a subtotal row (unit count, sum of net area) and a project total row.
- Summary strip above the table: units, verified, studio, 3½, 4½, 5½, total net m².
- Sort by any column. Filter chips: floor, type, bedrooms, balcony, status, needs review (any field under 0.7).
- Click a row: open the plan view on that floor with that unit selected. Hover a row: nothing tonight.
- Export CSV of the current filtered view.

**M5. Access and deploy.**
- One shared password. Middleware sets a cookie. Every route except login requires it.
- Deployed on a public URL. Not posted publicly.

**M6. Fallback.**
- If by 23:00 no real project is in, ship with `fixtures/units.seed.json` (fictional Quebec data, project `Condo Mont-Royal`) and run the Monday test on interface judgment, with the Excel comparison moved to Tuesday. The deck says so.

### Should (tonight if time remains, otherwise prototype 2)

- S1. Hover on a unit shows a 1-line tooltip: number, type, net m².
- S2. Keyboard: `1` plan, `2` schedule, `/` focuses a quick-find box for unit number.
- S3. `drawings` tab lists the connected files from `Project.drawings` with status, read only.

### Will not (prototype 1)

- Editing or verifying any field. Prototype 2.
- Any simulated AutoCAD or SketchUp screen. Prototype 2 and 3.
- Office DNA, compare, collections. Prototype 3.
- Revision comparison. Deck mockup only.
- Upload from the browser. Data goes in by script.
- Accounts, roles, multiple offices. Mobile layout.

## 5. User flows, prototype 1

**Flow 1, unit to data.** Open the project. Floor 5 in the left rail. Click unit 502 on the plan. Read type, bedrooms, net area, confidence on area. Click floor 6. Click 602. Compare.

**Flow 2, data to unit.** Open the schedule. Filter type 4½. Sort by net area. Click the smallest row. The plan opens on that floor with the unit selected.

**Flow 3, check the schedule.** Open the schedule. Read the floor 5 subtotal and the per-type summary. Export CSV. Open it beside the office Excel.

**Flow 4, distribution.** `all units` in the rail. Read the typology fill and the summary metrics. Click a unit to drill in.

## 6. Data model

Create every table tonight. Tables marked R2 and R3 stay empty until their round.

```
Project
  id, project_code (unique, e.g. P-2019-03),
  display_name (fictional or anonymized, e.g. "Condo Mont-Royal"),
  city (e.g. "Montréal"), year,
  typology (condo | mixed_use | rental | other),
  floors_count, units_count (derived), verified_count (derived),
  ingest_method (dxf | vision | manual | mixed),
  drawings jsonb [{filename, kind: dwg | skp | pdf, role: floor_plan | massing | other, floor_level, status: connected | indexed | outdated, indexed_at}],
  last_import_at, notes

Floor
  id, project_id, level (int), label (e.g. "Niveau 5"),
  sheet_number (e.g. A-205), source_file (e.g. "A-205_Niveau_05.dwg"), revision_date,
  image_url (title block masked), width_px, height_px,
  scale (text, e.g. "1:100"), px_per_m (float)

Unit
  id, project_id, floor_id
  number            text
  status            unverified | verified
  type_qc           text (studio | 3½ | 4½ | 5½ | 6½ | other)   confidence float
  bedrooms          int                                           confidence float
  bathrooms         float (1, 1.5, 2)                             confidence float
  rooms_count       int nullable                                  confidence float
  net_area_m2       float                                         confidence float
  gross_area_m2     float nullable                                confidence float
  orientation       text (N | S | E | W | NE | NW | SE | SW)      confidence float
  is_corner         bool                                          confidence float
  has_balcony       bool                                          confidence float
  balcony_area_m2   float nullable                                confidence float
  outline           jsonb [[x,y], ...] normalized 0 to 1, 3+ points
  label_pos         jsonb [x,y]
  computed_area_m2  float nullable (from outline and px_per_m)
  verified_at, verified_by text nullable
  notes, created_at, updated_at

Room                                  (optional, when the plan labels rooms)
  id, unit_id, name (e.g. "chambre 1", "salon"), area_m2 nullable, outline jsonb nullable

UnitEdit                              (R2)
  id, unit_id, field, old_value, new_value, edited_at, edited_by

PendingCadUpdate                      (R2)
  id, unit_id, field, proposed_value, target (attribute | schedule_cell | tag_text),
  status (pending | applied | dismissed), created_at, applied_at

UnitSimilarity                        (R3)
  unit_id, similar_unit_id, score float, basis (type | area | configuration | layout)

Collection                            (R3)
  id, project_id, name (default "design references"), created_at
CollectionItem                        (R3)
  collection_id, unit_id, note, added_at

BuildingLevelMap                      (R3, simulated SketchUp)
  project_id, floor_id, model_ref text, synced_at
```

Seed JSON (`fixtures/units.seed.json`) mirrors this: `projects[]`, `floors[]`, `units[]`, `rooms[]`, with each extracted field as `{"value": ..., "confidence": ...}`.

Rules:
- Never write a unit without an outline. An approximate rectangle is acceptable at low confidence.
- `type_qc` and `bedrooms` must agree where both are present: 3½ is 1 bedroom, 4½ is 2, 5½ is 3. If they disagree, keep both, set both confidences to 0.5, status stays `unverified`.
- Store square meters. Display ft² as `m2 * 10.764`, rounded to the unit.
- `status` flips to `verified` only through the prototype 2 verify action, never on import.

## 7. Technical approach

- **App:** Next.js (App Router), TypeScript, Tailwind, no component library. Server components for dashboard and schedule. Client components: plan viewer (pan, zoom, outlines, selection), filter bar, left rail.
- **Plan viewer:** floor image as `<img>` inside a transformed container, outlines as an SVG overlay with the same transform, `viewBox="0 0 1 1"`, `preserveAspectRatio="none"`, stretched to the image size, `vector-effect="non-scaling-stroke"` on outlines.
- **Database and storage:** Supabase. Postgres. Storage for floor images. Free tier.
- **Import:** `scripts/import/dxf.py` (`ezdxf`), `scripts/import/vision.ts`, `scripts/seed.ts`. Local.
- **Simulated screens (R2, R3):** static routes under `/sim/autocad/...` and `/sim/sketchup/...`, built as ordinary pages with host-app chrome per DESIGN.md section "Host chrome", reading the same database so unit numbers and values match the real app. Handoff buttons are real links into `/p/[project]/units?floor=&u=`.
- **Auth:** middleware with a signed cookie. Password in an environment variable.
- **Deploy:** Vercel.

Risk order tonight:

1. **Outlines.** DXF parsing is reliable only if the office draws unit boundaries as closed polylines on a consistent layer. Ask which layer. If not, use `/admin/outline`. 15 units at a minute each is 15 minutes.
2. **Image quality.** 200 dpi minimum, single image per floor tonight.
3. **Area units.** Quebec plans mix m² and ft². Read the unit on the plan text. Store m².

## 8. Tonight's plan

Build against the fixture first.

| Block | Hours | Output |
|---|---|---|
| 1. Repo, Supabase, every table in section 6, auth, deploy an empty page, seed script with the fixture, placeholder floor PNGs from simple SVGs | 1.5 | Live URL behind a password, fixture in the database |
| 2. Dashboard and project shell: list, new project form, workspace tabs with placeholders | 1 | M2 |
| 3. Plan view on fixture data: rail, viewer, outlines, selection, panel, all-units view | 3 | M3, flows 1 and 4 |
| 4. Schedule on fixture data: table, grouping, summary, filters, sort, row to plan, CSV | 1.5 | M4, flows 2 and 3 |
| 5. Real data in: DXF script, or vision pass, or admin outline page plus manual entry | 2 to 3 | A real floor in fitte |
| 6. Fallback check at 23:00 (M6) | 0 | Decision recorded |
| 7. Walk all four flows on the deployed URL. Fix only what blocks a flow. Screenshots | 1 | Test-ready |

Total: 10 to 11 hours. Stop at block 7.

## 9. Open questions

Answer at the office tonight, before block 5.

1. PDF or DXF for the test project's floor plans? If DXF, which layer holds unit boundaries, and are they closed polylines? Are unit numbers text or block attributes?
2. Which project? One the technicians still maintain, so the Excel is current.
3. Written yes from the lead architect to deploy anonymized plans behind a password.
4. Which three unit questions do the technicians actually get asked? Replace tasks A, B, C.
5. Screenshots of a real AutoCAD session and a real SketchUp session on their machines, with palettes and trays visible, for the simulated screens.

## 10. Deck notes to capture tonight and Monday

- The moment the data forced a design change.
- Every extraction failure and what it looked like. Screenshots.
- Confidence on every field, and verification as a separate human step.
- The plan as hero, the schedule as secondary.
- Revision impact cut, correction loop in.
- Plugins simulated, with the honest reason, and the handoff table as the design artifact.
- Timing per task per tester. Mismatch count and reasons. The palette-sketch reaction.
- The one sentence from a technician that confirms or changes prototype 2.

## 11. Prototype 2, Tuesday night: verify, correct, and the AutoCAD palette

**Real, web.**
- Edit in place on any field in the right panel. Enter saves, Escape cancels. Saved fields get confidence 1 and write a `UnitEdit` row.
- `verify unit` action. Sets `status: verified`, `verified_at`, outline stroke to `--ink`. `unverify` reverses it.
- Needs-review queue: units with any field under 0.7 or a type/bedroom disagreement, in order, with next and previous. Goal: clear a floor in under a minute per unit.
- Outline editing: drag a vertex. Recompute `computed_area_m2`. Show the delta against `net_area_m2`.
- Pending CAD updates: when an edited field is marked as CAD-linked in the project config, the panel shows `CAD update available` and a `review CAD updates` list. Nothing is written to any drawing. The list is what the simulated palette shows as pending.
- Sync status on every floor: `drawing updated, refresh unit data` when `Floor.revision_date` is newer than `last_import_at`. Manual flag tonight, detection later.
- Schedule and summary update live.

**Simulated, AutoCAD, routes `/sim/autocad/...`.** Host chrome per DESIGN.md. Same project and units from the database.
- `02 select`: floor plan in AutoCAD, docked fitte palette on the right showing project connection (current drawing, project, level) and `analyze units`.
- `analyze`: proposed unit outlines as translucent blue polygons over the plan. Floating review: `8 potential units identified · 6 ready for review · 2 need boundary selection`. `define boundary` and `publish to fitte` actions. `publish` links to the real plan view.
- `inspect`: palette expanded into a unit inspector for 502 (verified, typology, area, balcony, floor, orientation, rooms) with `find similar units`, `edit`, `open full unit dna`. `open full unit dna` links to `/p/[project]/units?floor=5&u=502`.
- `pending updates`: the proposed change for 502 from the real `PendingCadUpdate` table, `apply to drawing` marks it applied.

**Wednesday test.** Two technicians. Clear the needs-review queue for one floor, timed per unit. Compare the schedule to the Excel again. Walk the simulated palette: would you trust `publish`, what would you want in the inspector, is `pending updates` the right place for CAD writes.

## 12. Prototype 3, Thursday night: Office DNA, compare, SketchUp context, retrieval

**Real, web.**
- Two more past projects imported. Similarity computed at import into `UnitSimilarity`: same `type_qc`, net area within 10 percent, corner flag match, outline proportion (bounding box aspect and polygon similarity).
- `office dna` tab: search prefilled from the current unit (bedrooms, area range, corner, orientation), editable chips. Results as a dense grid of plan crops, each with project display name, year, unit number, area, type, and a match basis label (`close layout match`, `close area match`, `similar configuration`). Every result is a real archived drawing.
- Archived unit page: large plan crop, right panel with total and room areas, overall dimensions, bedrooms and bathrooms, configuration notes, source project, drawing filename, revision. Toolbar: `compare`, `open in autocad` (simulated handoff), `add to collection`.
- Compare workspace: two plans at the same real-world scale using `px_per_m`, independent orientation preserved, optional rotation, toggles for room boundaries, area labels, overall dimensions. Attribute table below, differences marked.
- Collections: `design references` per project. Add a unit with a note. Listed in the project's `office dna` tab.
- Dashboard polish: connected drawings with status per project, SKP listed.

**Simulated, SketchUp, routes `/sim/sketchup/...`.**
- `04 connect`: massing model, fitte extension panel, select project, connected SKP, `map building levels`.
- `map levels`: fifth-floor massing band outlined in blue, level assignment list, `sync building context`. Writes `BuildingLevelMap`.
- In the real plan view: a `2D floor plan | 3D building context` toggle above the viewer. 3D state is a static rendered image of the massing with the current level highlighted and an approximate unit marker. Labeled `simulated`.

**Simulated, AutoCAD, route `/sim/autocad/retrieve`.**
- `07 retrieve`: the archived drawing open in AutoCAD, unit 304 highlighted, palette shows `selected historical unit: 304`, `copy unit geometry`, and a note that selected entities require review before copy.

**Thursday night or Friday morning test.** Two technicians. Task: starting from a real current unit, find the closest past layout and say how its area and layout differ. Timed. Then: compare two results, and save one to the collection. Then walk the simulated SketchUp and retrieval screens: is level mapping worth the step, and would you copy geometry this way.
