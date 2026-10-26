# CLAUDE.md

Repo conventions for coding agents. Short on purpose.

## Read first, in this order

1. `CONTEXT.md`: what, why, who, real versus simulated, glossary, data model in words, decisions.
2. `PRD.md`: section 4 is prototype 1, tonight. Sections 11 and 12 are prototype 2 and 3. Build the schema and the routes for all three tonight. Build the features of prototype 1 only.
3. `DESIGN.md`: visual rules for fitte web screens and for simulated host screens.
4. `fixtures/units.seed.json`: sample data. Build the UI against this before real data exists.

## Working rules

- Build the UI against the fixture first. Do not wait for the import scripts or the real plans.
- Scope is PRD.md section 4 Must list. If a task is not on it, stop and ask. Prototype 2 and 3 features are not tonight, even if the table or route already exists.
- Create every table in PRD.md section 6 tonight, including the R2 and R3 tables. Leave them empty.
- Routes that exist: `/`, `/login`, `/p/[project]/units`, `/p/[project]/schedule`, `/admin/outline`, `/p/[project]/office-dna`, `/p/[project]/office-dna/[unit]`, `/p/[project]/office-dna/compare`, `/sim/autocad/retrieve`. The `drawings` and `building` tabs render the placeholder line.
- Never write a unit without an outline polygon. An approximate rectangle with low confidence is acceptable.
- `status` is `unverified` on every imported unit. Only the prototype 2 verify action sets `verified`.
- Store areas in square meters. Display ft² as `m2 * 10.764` rounded to the unit.
- Unit outlines are normalized 0 to 1 on the floor image. Render them as an SVG overlay with `viewBox="0 0 1 1"`, `preserveAspectRatio="none"`, and `vector-effect="non-scaling-stroke"`.
- Floor and selected unit live in the URL (`?floor=5&u=502`). Every future handoff from a simulated screen targets that URL. Do not change its shape.
- Follow DESIGN.md literally. When it is silent, choose the denser, quieter option. No shadows, no gradients, no illustrations, no marketing copy, no cards.
- Plans are never tinted, filtered, or bordered. Typology fills are overlays. Linework must stay crisp at every zoom.
- Keep secrets in `.env.local`. Never commit them. Keep `.env.example` current.
- Prefer server components. Client components: plan viewer, filter bar, left rail.
- Commit after each PRD block (section 8). Commit message: the block name.

## Stack

Next.js App Router, TypeScript, Tailwind, no component library. Supabase (Postgres, Storage). Vercel. Import scripts in `/scripts/import` (`dxf.py` with `ezdxf`, `vision.ts`), seed in `/scripts/seed.ts`.

## Language

Plans are in French and so is the interface. Keep French values as they appear on the plans (unit types as `3½`, `4½`, `5½`, room names as labeled). Do not translate them, and do not re-translate them into a different French either. Project display names are fictional or anonymized and appear as given. Québec French, not France French: `superficie` not `surface`, `étage` for a storey, `chambre` for a bedroom, `feuille` for a drawing sheet. Dates on drawings stay ISO (`2022-11-14`) because that is how the sheets carry them. Numbers keep the decimal point the schedule already uses, not a comma, so a figure copied into a spreadsheet survives.

## Simulated screens

`/sim/autocad/retrieve` exists: the archived sheet open in the host, the historical unit selected, the fitte palette docked right. SketchUp routes are not built. Rules for any simulated screen: static routes under `/sim/autocad/...` and `/sim/sketchup/...`, ordinary pages reading the same database, host chrome per DESIGN.md "Host chrome", a `simulated` label bottom-left, and every cross-environment button a real link to the web route with the unit in the URL. Never claim a simulated screen is connected to an installed application.

## When something fails

Log it, keep going, report at the end of the block. A failed DXF parse or a wrong outline is expected. A blocked flow is not. Fix only what blocks one of the four flows in PRD.md section 5.

## Do not

- Do not install a component library. Tailwind only.
- Do not add editing, verifying, revision comparison, SketchUp building context, dark mode, mobile layout, accounts, or browser upload tonight. Office DNA search, the archived unit page, compare and collections are built; keep them on the fixture archive in `fixtures/archive.seed.json`.
- Do not generate, edit, or redraw any plan.
- Do not write to any drawing file, ever. CAD updates are proposed records a human applies inside AutoCAD.
- Do not write client, developer, or consultant names or street addresses anywhere, including logs and fixtures.
