# CONTEXT.md

Product name: **fitte**. Lowercase in the interface, wordmark `fitte.` with the period. Package and repo name `fitte`.

This file is the shared memory for every agent and person on the project. Read it before PRD.md. Keep it current. When a decision changes, edit the decision here and add one line to the log at the end.

---

## 1. What this is

fitte connects a condo project's AutoCAD floor plans, its structured unit data, and the office's archive of past layouts. It has three environments:

1. **AutoCAD**, where technicians draft and select units. fitte appears as a docked palette: identify units, inspect one, publish verified data, retrieve a past layout.
2. **fitte web**, where unit data, the unit schedule, historical layouts, comparisons, and the project library live. The browser handles anything heavier than a palette.
3. **SketchUp**, where the exterior massing lives. fitte appears as a small extension that maps model geometry to building levels. Optional context, never a source of interior geometry.

Two capabilities run through all three:

- **Unit DNA.** Every dwelling unit is identified from its AutoCAD boundary and becomes a verified record: type, bedrooms, area, balcony, floor, orientation, rooms, source drawing. The records form the unit schedule.
- **Office DNA.** Any unit becomes a search. The archive of past projects returns real drawn layouts that match by type, area, and configuration, to compare and reuse.

One sentence: **fitte reads floor plans to extract units, the way a takeoff tool reads drawings to extract quantities, then makes the office's past work searchable from the drawing you are in.**

## 2. Why it exists

Two reasons, in this order.

**The portfolio reason.** This is a one-week product design case study for a product design role at Bobyard, an AI B2B SaaS startup in San Francisco. Bobyard automates estimation and takeoffs for construction trades from drawings. The case study must show craft and execution first, then product thinking: decisions pushed for, problems reframed, scope influenced. The deliverables are a shipped web prototype, high-fidelity simulated AutoCAD and SketchUp screens with explicit handoffs, a slide deck of the end-to-end process, and a public launch post. The deck is due Friday 2026-10-30. A presentation to the Bobyard design team follows a few days later.

**The user reason.** On a 100 to 200 unit condo building the unit schedule (every unit, its type, its area, its floor) is a legal and commercial document. The developer prices from it. The notary registers from it. The office rebuilds it by hand in Excel after every revision, by reading the plans unit by unit. And when a technician designs a new two-bedroom corner unit, the office has drawn fifty of them before, in project folders nobody searches. The plans hold the truth and the knowledge. Neither is reachable from inside the drawing.

## 3. Who it is for

One architecture firm in Quebec. Lead architect plus two architectural technicians (draftsmen and modellers). Large residential and mixed-use condo buildings, 100 to 200 units, under Part 3 of the Code de construction du Québec.

**Their toolchain.** AutoCAD is primary: unit layouts, plans, elevations, annotations, dimensions, schedules, shadow studies. SketchUp is secondary: exterior massing and facade only. There is no detailed interior 3D model. The 2D plans hold the building intelligence.

**The two technicians are the users and the testers.** They draw the unit layouts, maintain the unit schedule, and answer "do we have a layout like this from before." They test every prototype with real project data. The lead architect decides what may be deployed and is not a tester.

Test group size is two people from one office. Say so in the deck. Do not generalize.

## 4. What is real and what is simulated this week

This distinction is in every document and on every deck slide.

**Real (functional web app, tested by the technicians):** project dashboard, unit plan view with inspector, unit schedule, correction and verification of unit data, Office DNA search over a small historical database, side-by-side comparison.

**Simulated (high-fidelity screens in host-app chrome, with working handoff links into the real web app):** the AutoCAD palette (identify units, inspect unit, publish, pending updates, retrieve historical geometry), the SketchUp extension (map building levels, sync context), and the 3D building context toggle.

Simulated screens use the same project, the same unit numbers, and the same drawing references as the real app, so a viewer can follow one unit across all three environments. They are built as static pages inside the web app under `/sim/...` and are labeled `simulated` in a corner. Native plugins and automated CAD indexing are named in the deck as the next engineering tasks.

## 5. Domain glossary

Quebec terms appear on the plans. Agents must recognize both languages.

| English | French (as it appears on drawings) | Meaning |
|---|---|---|
| unit, suite | logement, unité | One dwelling |
| unit number | numéro de logement, no. | e.g. 502: floor 5, unit 02 |
| unit type (Quebec count) | 3½, 4½, 5½ | Quebec counts rooms, with ½ for the bathroom. 3½ is one bedroom, 4½ is two, 5½ is three. Studio is 1½ or 2½ |
| bedrooms | chambres, cc | Bedroom count. "2 cc" is two bedrooms |
| net area | superficie nette, sup. nette | Floor area inside the unit's walls |
| gross area | superficie brute | Area including walls, used for pricing |
| floor, level | étage, niveau | Storey |
| orientation | orientation | Which way the main windows face: N, S, E, W, or two |
| corner unit | unité de coin | Two exterior exposures |
| balcony, terrace | balcon, terrasse | Exterior private space, often with its own area |
| demising wall | mur mitoyen, séparation entre logements | Wall between two units |
| corridor | corridor | Public circulation |
| unit schedule | tableau des logements, tableau des superficies | The register fitte produces |
| sheet | feuille, planche | One drawing sheet, e.g. A-205 |
| revision | révision, rév. | A dated issue of a sheet |
| layer | calque | AutoCAD layer |
| polyline | polyligne | Closed outline in AutoCAD, often the unit boundary |
| block, attribute | bloc, attribut | AutoCAD symbol with text fields, often the unit tag |
| palette | palette | AutoCAD docked tool panel |
| extension, tray | extension, barre d'outils | SketchUp plugin UI |

Areas are in square meters on Quebec drawings, sometimes also in square feet for marketing. Store square meters. Display both.

## 6. The data model, in words

**Project.** A building. Code, display name (fictional or anonymized), city, year, floor count. Connected drawings: a list of DWG and SKP files with a status (connected, indexed, outdated).

**Floor.** One storey of one project. One plan image per floor, from one sheet at one revision date, with scale and pixels per meter.

**Unit.** One dwelling on one floor. Has an outline (a polygon on the plan, normalized 0 to 1), a label position, the record fields, a confidence per extracted field, and a verification status: `unverified`, `verified`. Verified means a human confirmed the boundary and the fields. Rooms are optional child records (name, area) when the plan labels them.

**Edits and pending updates.** Every field change is logged. A change to a field that also lives in the drawing (a tag attribute, a schedule cell) creates a pending CAD update, which a human applies inside AutoCAD. fitte never writes to a drawing silently.

**Similarity.** Precomputed pairs of units across projects with a score and a basis (type, area, configuration).

**Collections.** A project's design references: historical units a technician saved with a note.

**Authoritative sources.** Boundary geometry: the DWG. Area: verified geometry plus the office's measurement rule. Classification: verified fitte metadata, reconciled to CAD attributes where linked. Historical plans: the archived DWGs. Exterior geometry: the SKP. fitte extracts, links, calculates, and indexes. It owns the metadata, not the drawings.

## 7. Constraints

- **Time.** Prototype 1 ships Sunday night 2026-10-25. Test Monday. Prototype 2 ships Tuesday night. Test Wednesday. Prototype 3 ships Thursday night. Test Thursday night or Friday morning. Deck starts Wednesday whatever the state of the product.
- **Team.** One designer who vibe codes with Claude and Codex in a terminal. A brother who is an ML engineer and can answer questions but does not build.
- **No native plugins this week.** AutoCAD and SketchUp screens are simulated. The AutoCAD .NET or LISP API and the SketchUp Ruby API are named as the real extension points in the deck.
- **No model training this week.** Unit identification uses deterministic DXF parsing where plans export cleanly, a vision language model through an API otherwise, and manual tracing as the fallback. The deck says which was used per project.
- **Real data.** Every prototype is tested on real projects from the office. Anonymized: project codes and fictional display names, city only, no addresses, no developer names, title blocks masked. The lead architect's yes before deploy. The deployed app is behind a shared password. The public launch shows screenshots and a video, never the live data.
- **Data preparation is the hidden time sink.** Plans arrive as PDF or DXF. DXF is preferred: unit boundaries are often closed polylines on a layer and labels are text or block attributes with coordinates. PDF needs rasterization and a vision model.

## 8. Design principles

Declarative, minimal, design-research register. No marketing language in the interface.

1. **Stay in the drawing.** A technician never leaves AutoCAD to identify a unit or read its basic data. The browser is for what a palette cannot hold: search, galleries, comparison, the library.
2. **The plan is the hero.** In the web app, full-screen. Everything else is a panel beside it. Metadata never covers the drawing.
3. **Every number has a place on the plan.** Click a row, the unit lights up. Click a unit, the row scrolls into view.
4. **Provenance and sync are visible.** Every unit shows its source drawing and revision. A changed drawing shows `drawing updated, refresh unit data`. A changed field that lives in CAD shows `CAD update available`. Nothing syncs invisibly.
5. **Show uncertainty, then let a human verify.** Extracted fields carry a confidence. Verification is one action. Verified units look different from unverified ones everywhere.
6. **Real drawings, never generated ones.** Every Office DNA result is a drawn layout from a past project, shown from its source drawing.
7. **Host chrome for host screens.** A simulated AutoCAD palette looks like AutoCAD. A simulated SketchUp tray looks like SketchUp. fitte's own tokens apply only inside the palette body.
8. **Density is respect.** Technicians read dense sheets all day. No cards with padding. No empty states with illustrations.

## 9. What fitte is not

- Not a CAD tool. It never edits linework on its own. Writes to CAD are proposed, reviewed, and applied by a human inside AutoCAD.
- Not a generator. No AI-drawn plans. Office DNA returns real archived drawings.
- Not a code checker. It does not judge unit sizes or egress.
- Not an interior 3D tool. SketchUp provides building-level context only. fitte never pretends a massing model contains a unit's rooms.
- Not a revision tracker this week. Revision impact is a mockup slide.

## 10. Roadmap

- **Prototype 1 (Sunday night).** Unit DNA, web. Project dashboard, unit plan view with inspector, unit schedule, one real project, one or two floors. See PRD.md.
- **Prototype 2 (Tuesday night).** Verification and correction loop, plus the AutoCAD palette simulated: identify units, inspect unit, publish, pending updates. Handoffs from the palette into the real unit page.
- **Prototype 3 (Thursday night).** Office DNA: two more past projects, search, gallery, compare workspace, collections. The SketchUp extension simulated and the 3D context toggle. Historical retrieval in AutoCAD simulated.
- **Deck mockups only.** Revision impact. Native plugin architecture. Automated DWG indexing across the whole archive.

## 11. The seven screens

Same project, same unit 502, same drawing references throughout.

| # | Screen | Environment | Status | Round |
|---|---|---|---|---|
| 01 | Project dashboard: connected DWGs, SKP, overview | web | real | 1 (minimal), 3 (polish) |
| 02 | Unit selection with docked fitte palette | AutoCAD | simulated | 2 |
| 03 | Unit DNA: large 2D plan, unit data, building navigation | web | real | 1 |
| 04 | Massing connection: levels highlighted and linked | SketchUp | simulated | 3 |
| 05 | Office DNA search: gallery of matching past layouts | web | real | 3 |
| 06 | Unit comparison: two plans at matching scale, data table | web | real | 3 |
| 07 | Historical drawing retrieval, unit highlighted | AutoCAD | simulated | 3 |

## 12. Decision log

- 2026-10-24: Focus on the boring, repetitive parts of architecture practice, not design.
- 2026-10-25: First direction was a construction detail library (working name coupe). Dropped. Reason: the office's intelligence lives in 2D unit plans, and the unit schedule is the artifact rebuilt most often by hand.
- 2026-10-25: Product is fitte: Unit DNA and Office DNA across AutoCAD, web, and SketchUp. Reason: a technician should not leave the drawing to identify a unit or find a past layout. The web app holds what a palette cannot.
- 2026-10-25: AutoCAD and SketchUp are simulated screens this week, with working handoffs into the real web app. Reason: native plugins are a larger engineering task. The deck says so plainly.
- 2026-10-25: Revision impact cut to a deck mockup. Reason: it needs two clean revisions and a reliable extractor first.
- 2026-10-25: Writes to CAD are always proposed and human-applied. Reason: trust. Invisible sync between loose 2D geometry and a database is a promise the product cannot keep.
- 2026-10-25: SketchUp maps floors to massing only. Reason: the office has no interior model, and pretending otherwise would mislead.
- 2026-10-25: Testers are the two technicians only, with real project data.
