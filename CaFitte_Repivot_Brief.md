# Fitte — Product Repivot and Agent Implementation Brief

**Document status:** Agent-ready product and redesign brief  
**Product:** Fitte  
**Primary context:** Early-stage Québec residential condominium design  
**Legacy authoring tools:** AutoCAD LT 2025 (2D floor plans) and SketchUp 2015/2018 (3D massing and windows)  
**Last updated:** October 26, 2026

> **Core product promise:** Fitte helps an architectural technician catch window discrepancies between 2D plans and 3D massing early, then understand whether those changes may affect exposing-building-face / unprotected-opening calculations before the team loses hours to downstream redesign.

---

## 1. Executive summary

Fitte is being repivoted from a broad architectural version-control and organizational concept—previously framed around ideas such as **Unit DNA** and **Office DNA**—into one focused coordination workflow.

The new product story is:

1. A technician changes windows in an AutoCAD LT floor plan.
2. The older SketchUp massing model no longer matches, or vice versa.
3. The mismatch is hard to notice because the files are separate and the tools do not share a reliable model.
4. Window changes can alter the area of unprotected openings on an exposing building face (French: *façade de rayonnement*).
5. Teams often perform or finalize that analysis late, when a problem can force façade, unit-layout, or massing changes.
6. Fitte compares the 2D and 3D representations, explains discrepancies, and raises an early code-impact warning for professional review.

This is a **coordination and early-warning tool**, not BIM, a code calculator of record, or an authority having jurisdiction. The prototype should make one workflow credible and understandable rather than attempt to become a full architectural platform.

---

## 2. Product thesis

### The problem

Small and mid-sized architectural teams may develop residential projects with a split workflow:

- AutoCAD LT is the practical source for floor plans and dimensions.
- An older SketchUp version is used for massing, visualization, and façade development.
- Windows are represented independently in both files.
- Changes are communicated manually and are easy to miss.
- A window can move, resize, appear, or disappear in one representation without being updated in the other.
- The code consequence of a change may not be evaluated until late design development.

The most expensive failure is not merely that two files differ. It is that the team discovers too late that the current amount or distribution of glazing may not work for the relevant exposing-building-face conditions, creating avoidable rework.

### The opportunity

Fitte creates a lightweight bridge between familiar legacy tools. It gives the team an early answer to three questions:

1. **What changed?**
2. **Do the plan and massing model still agree?**
3. **Could the change affect the façade-opening analysis enough to require attention now?**

### The product boundary

Fitte should say:

- “These three windows do not match.”
- “Opening area on the east façade increased by approximately 4.8 m².”
- “This change may affect the applicable unprotected-opening allowance.”
- “Confirm the inputs and have the result reviewed by the responsible professional.”

Fitte should **not** say:

- “This building is code-compliant.”
- “This façade passes Québec code.”
- “No architect, code consultant, or authority review is needed.”

---

## 3. Primary persona

### Architectural technician / intermediate designer

**Environment**

- Works on early design and design development for residential condominium projects in Québec.
- Uses AutoCAD LT 2025 on a Windows 10 workstation for 2D production.
- Uses SketchUp 2015 or 2018 for massing and façade coordination.
- Exchanges DWG, DXF, SKP, PDF, image, and spreadsheet files through shared folders.
- May be prototyping or reviewing Fitte on a MacBook, even though the production workflow remains Windows-based.

**Goals**

- Keep plan and massing windows aligned.
- Understand exactly what changed between two revisions.
- Find high-impact discrepancies before investing more design time.
- Prepare clear evidence for an architect or code specialist.
- Avoid redoing façades, unit layouts, and presentation models late in the process.

**Pain points**

- No single live model connects AutoCAD LT and legacy SketchUp.
- File names and timestamps are unreliable indicators of design intent.
- Manual visual comparison is slow and inconsistent.
- Window identity is not stable across formats.
- Code-related calculations rely on project facts that may still be uncertain.
- Late findings can cascade into many drawings and presentations.

### Secondary persona

An architect, project lead, or code consultant who reviews flagged changes, corrects assumptions, and determines whether the design needs action.

---

## 4. Current direction versus new direction

| Area | Previous direction | Repivoted direction |
|---|---|---|
| Core problem | General file/version fragmentation | Window discrepancies and late code-impact discovery |
| Main value | Organize and reuse project/office knowledge | Prevent avoidable redesign by detecting a concrete risk early |
| Concepts | Unit DNA, Office DNA, broad version control | Plan-to-model comparison, façade status, review-ready evidence |
| Primary object | Files, units, standards, versions | Windows grouped by elevation / exposing building face |
| Product surface | Broad dashboard or architectural workspace | Focused project comparison workflow |
| Proof point | Better organization | A changed window is found, located, quantified, and triaged |
| Code role | Broad intelligence layer | Transparent, provisional early warning only |
| Prototype goal | Demonstrate a platform | Demonstrate one end-to-end coordination story |

### What to keep from the existing prototype

Retain only reusable foundations:

- Project creation and project metadata.
- File upload / import components.
- Revision history primitives.
- Existing visual language, tokens, and navigation components that support the new flow.
- Any comparison viewer or annotation system that can be simplified around windows.
- Unit or building metadata only when it helps locate a window or façade.

### What to demote or remove

- Unit DNA and Office DNA as primary navigation or headline concepts.
- Generic activity feeds without a direct relationship to discrepancies.
- Broad document-management features.
- Collaboration features that do not support review of a detected issue.
- AI features without traceable source geometry or assumptions.
- A portfolio-wide dashboard as the first screen of the case-study prototype.

These ideas may remain future platform opportunities, but they should not compete with the new hook.

---

## 5. Core user story

> As an architectural technician, I want to compare the latest AutoCAD plan against the current SketchUp massing model so I can identify missing, moved, or resized windows and see which discrepancies may affect the exposing-building-face analysis before the team develops the design further.

### Primary success scenario

1. The user opens a condominium project.
2. Fitte identifies the last accepted comparison baseline.
3. The user imports a new 2D export and a new 3D export.
4. Fitte proposes scale, storey, orientation, and façade alignment.
5. The user confirms or corrects the mapping.
6. Fitte matches windows and classifies discrepancies.
7. The user sees the building with affected façades emphasized.
8. Selecting the east façade reveals four changes.
9. Fitte estimates the change in unprotected-opening area.
10. A potential code-impact warning appears because the changed total approaches or exceeds a provisional allowance, or because required inputs are missing.
11. The user reviews each match, corrects false positives, and assigns the issue for professional review.
12. Fitte produces a concise comparison report with evidence, assumptions, and unresolved items.

---

## 6. Detailed workflows

### Workflow A — Create a comparison

1. Select a project and building.
2. Choose the baseline revision.
3. Add the current plan source:
   - preferred MVP input: vector PDF or DXF exported from AutoCAD LT;
   - fallback: flattened PDF with manual calibration;
   - DWG may be accepted later through a dedicated conversion service.
4. Add the current SketchUp source:
   - preferred MVP input: DAE, OBJ, or another geometry export that SketchUp 2015/2018 can produce reliably;
   - optional direct SKP ingestion only if the chosen parser supports the exact legacy versions;
   - fallback: elevation images plus manual window rectangles.
5. Confirm units, scale, north, storeys, and façade labels.
6. Confirm which layers/tags represent exterior walls and windows.
7. Run comparison.

### Workflow B — Resolve window matches

Fitte proposes one of these states for every detected opening:

- **Matched:** position and dimensions are within tolerance.
- **Moved:** likely same window, different position.
- **Resized:** likely same window, different width and/or height.
- **Added in plan:** no corresponding 3D window.
- **Added in model:** no corresponding 2D window.
- **Removed:** present in baseline, absent in the current revision.
- **Ambiguous:** multiple possible matches or insufficient evidence.
- **Ignored:** intentionally excluded by the user, with a reason.

The user can accept a proposed match, link two objects manually, split/merge a match, change the façade assignment, or mark a finding as intentional.

### Workflow C — Review façade impact

1. Group confirmed window geometry by façade and, where relevant, by storey, fire compartment, or review portion.
2. Display total façade area and aggregate unprotected-opening area.
3. Show the change from the accepted baseline.
4. Ask for missing project facts before producing a threshold comparison.
5. Present the result as:
   - no material change detected;
   - review suggested;
   - professional review required;
   - insufficient information.
6. Never collapse these states into an unqualified green “code pass.”

### Workflow D — Share and close the loop

1. Add a short comment or proposed resolution.
2. Assign the issue to a responsible reviewer.
3. Export a PDF/CSV/JSON comparison package or copy a shareable summary.
4. Mark the revision as accepted only after human review.
5. Use the accepted revision as the next baseline.

---

## 7. MVP scope

### Must have

- One project with one building and a small set of storeys.
- Import of an AutoCAD-compatible 2D export and a SketchUp-compatible 3D export.
- Manual calibration for scale, coordinate alignment, orientation, storey, and façade.
- Extraction or manual tracing of exterior window openings.
- Window matching using geometry and proximity.
- Difference types: added, removed, moved, resized, ambiguous.
- Confidence score and visible comparison tolerance.
- 2D plan/elevation and simple 3D façade views with linked selection.
- Façade-level opening-area totals and before/after delta.
- Explicit inputs and assumptions for any provisional code-impact indicator.
- Human confirmation of matches and input values.
- Review status, comment, and exportable issue summary.
- Sample project data sufficient to tell the full case-study story.

### Should have if time permits

- Overlay slider between baseline and current revisions.
- Batch accept for high-confidence matches.
- Storey and façade filters.
- Issue severity based on magnitude, confidence, and proximity to a user-supplied limit.
- A small audit log showing who accepted an assumption or match.
- Bilingual domain labels where useful: exposing building face / *façade de rayonnement*; unprotected openings / *ouvertures non protégées*.

### Out of scope

- Native AutoCAD or SketchUp plug-ins.
- Real-time two-way synchronization.
- Editing the source DWG or SKP from Fitte.
- Full BIM authoring or IFC coordination.
- General clash detection.
- Automated occupancy, construction type, sprinkler, or code-edition determination.
- Permit-ready or sealed calculations.
- Automatic interpretation of every Québec or municipal exception.
- Energy, egress, accessibility, structural, daylight, privacy, or civil-law window compliance.
- A complete Unit DNA / Office DNA knowledge platform.
- Enterprise permissions, billing, or organization administration.

---

## 8. UX information architecture and screens

The prototype should open close to the work, not on a broad analytics dashboard.

### Screen 1 — Project / latest coordination status

**Purpose:** Get the user into the current comparison quickly.

Show:

- Project name, building, phase, location, and responsible team.
- Latest accepted baseline and current uploaded revision.
- A concise status: “7 window differences · 2 need review · East façade affected.”
- Primary action: **Review comparison**.
- Secondary action: **Upload new revision**.

Avoid vanity metrics and generic productivity charts.

### Screen 2 — Import and alignment

**Purpose:** Make imperfect legacy inputs trustworthy enough to compare.

Use a guided stepper:

1. Files
2. Units and scale
3. Storeys
4. Orientation and origin
5. Window layers / objects
6. Façade mapping
7. Confirm

Show a preview at every step. Any automatic suggestion must be editable and display its confidence.

### Screen 3 — Comparison workspace (hero screen)

**Purpose:** Make the core value evident within seconds.

Suggested layout:

- Left: filters and discrepancy list.
- Centre: linked visual viewer, with 2D/elevation and 3D modes.
- Right: selected discrepancy details and resolution controls.
- Top: baseline/current selectors, comparison status, export action.
- Bottom or compact summary bar: affected façade, opening-area delta, and review state.

Use a restrained difference language:

- Blue: plan geometry.
- Warm amber: 3D geometry or review warning.
- Magenta/red only for unresolved high-impact discrepancies.
- Neutral grey for unchanged context.

Do not rely on colour alone; use outlines, icons, labels, and patterns.

### Screen 4 — Façade impact panel

**Purpose:** Connect a geometry change to a possible project consequence.

Show:

- Façade name and review portion.
- Diagram or elevation with counted openings highlighted.
- Exposing-building-face area used.
- Current aggregate opening area and percentage.
- Baseline values and delta.
- User-entered limiting distance and other applicable inputs.
- Provisional maximum or user-supplied threshold, if enough inputs exist.
- Remaining margin or estimated overage.
- Clear “why this is flagged” explanation.
- Source and timestamp for every input.
- Persistent disclaimer and **Request professional review** action.

### Screen 5 — Issue detail / evidence

**Purpose:** Support verification rather than demand trust in automation.

Include:

- Side-by-side crops from plan and model.
- Proposed match and confidence.
- Width, height, sill, position, storey, façade, and area differences.
- Detection method: parsed, inferred, or manually traced.
- Actions: accept, relink, edit geometry, ignore with reason.
- Comment and assignment.

### Screen 6 — Review report

**Purpose:** Create a handoff artifact for the architect or code consultant.

Include:

- Revision identifiers and file hashes where available.
- Confirmed discrepancies and unresolved ambiguities.
- Before/after façade totals.
- All project inputs and assumptions.
- Provisional warnings, not compliance conclusions.
- Reviewer, date, and status.
- Links or object IDs back to the comparison workspace.

---

## 9. Data flow and conceptual model

```text
AutoCAD LT 2025                    SketchUp 2015/2018
        │                                  │
        ├─ DXF / vector PDF                ├─ DAE / OBJ / supported SKP
        │                                  │
        └──────────────┬───────────────────┘
                       ▼
              Import + normalization
              - units and scale
              - coordinate system
              - storey/elevation
              - orientation
              - source provenance
                       ▼
              Window candidate extraction
              - parsed geometry
              - inferred geometry
              - manual tracing fallback
                       ▼
              Matching and discrepancy engine
              - façade/storey eligibility
              - position and dimension deltas
              - match confidence
              - user confirmation
                       ▼
              Façade aggregation
              - façade/review-portion area
              - aggregate opening area
              - baseline/current delta
                       ▼
              Provisional rule evaluation
              - project and code inputs
              - missing-data gates
              - warning rationale
                       ▼
              Comparison workspace + report
```

### Core entities

- **Project:** name, location, phase, governing-context notes.
- **Building:** orientation, storeys, occupancy assumptions, sprinkler assumption.
- **Revision:** source file, source application/version, timestamp, hash, status.
- **Storey:** name, elevation, height.
- **Façade / review portion:** orientation, boundary, gross area, limiting-distance input.
- **Window candidate:** geometry, source, confidence, storey, façade, provenance.
- **Window match:** 2D object, 3D object, match score, status, reviewer decision.
- **Discrepancy:** type, magnitude, severity, explanation, resolution.
- **Code-input set:** code edition, building-part assumption, occupancy, sprinkler status, limiting distance, calculation method, municipal overlay notes.
- **Assessment:** calculated totals, threshold source, warning level, reviewer status.

### Provenance requirements

Every value should record whether it was:

- read directly from source geometry;
- inferred by Fitte;
- entered by a user;
- imported from a previous accepted revision; or
- overridden during review.

This distinction must be visible in the UI and included in exports.

---

## 10. Provisional calculations and code guardrails

### Product language

Use **“potential code impact,” “provisional allowance,” “review required,”** and **“decision support.”** Do not use **“certified,” “verified compliant,” “approved,”** or unqualified **“pass.”**

### Useful geometric calculations

For a rectangular window candidate:

```text
opening_area = rough_width × rough_height
```

For a façade review portion:

```text
aggregate_opening_area = sum(area of included unprotected openings)
actual_opening_percentage = aggregate_opening_area / exposing_face_area × 100
change_from_baseline = current_aggregate_opening_area - baseline_aggregate_opening_area
provisional_margin = provisional_permitted_area - current_aggregate_opening_area
```

For non-rectangular openings, use polygon area. State whether dimensions represent rough openings, frame extents, or glazed area; never mix methods silently.

### Inputs that must not be guessed silently

- Applicable Québec code edition and transition rules.
- Whether the building is evaluated under the relevant Part 3 or Part 9 provisions.
- Occupancy classification and fire-compartment organization.
- Whether the building and relevant spaces are sprinklered as required by the chosen method.
- Definition and extent of each exposing building face or permitted portion.
- Limiting distance and the line to which it is measured.
- Gross exposing-building-face area.
- Which doors, windows, vents, or other penetrations count as unprotected openings.
- Applicable construction, cladding, and fire-resistance conditions.
- Irregular/skewed-wall treatment, projections, streets, property lines, and exceptions.
- Municipal requirements or project-specific interpretations.

### Evaluation states

- **Geometry only:** Fitte can compare windows but lacks enough confirmed inputs for a threshold assessment.
- **Provisional estimate:** all required prototype inputs are present, but the result is not professionally validated.
- **Review required:** a material change, low margin, apparent overage, conflicting input, or low-confidence geometry exists.
- **Reviewed:** a named qualified reviewer has recorded a decision; this is an audit state, not a permit approval.

### Why the guardrail matters

The National Building Code framework treats aggregate unprotected openings as a percentage of an exposing-building-face area, with results depending on factors such as limiting distance and sprinkler conditions. Québec adopts and modifies national model-code provisions, and municipal construction rules may add requirements or be more stringent. Fitte must therefore expose its method and defer the final interpretation to the responsible professional and applicable authority.

### Validation plan before any production use

1. Select the exact Québec code edition and project transition date.
2. Have a Québec architect or qualified code consultant define the supported building class and calculation method.
3. Create a validated test set with hand-calculated examples, including edge cases.
4. Compare Fitte outputs against those signed-off examples.
5. Lock rule-set versions and show them in every assessment/report.
6. Require revalidation whenever calculation logic or source-code provisions change.

---

## 11. Practical technical constraints

### Windows 10 and legacy applications

- AutoCAD LT and SketchUp 2015/2018 should be treated as file-based systems, not assumed to expose modern cloud APIs.
- AutoCAD LT may not support the same automation or advanced object workflows as full AutoCAD.
- Old SKP formats and third-party parsers may have compatibility, licensing, or platform limitations.
- Layer naming, component hygiene, and modelling conventions will vary substantially between projects.
- Source files may contain proxies, nested blocks/components, exploded geometry, inconsistent units, or windows drawn only symbolically.
- Corporate Windows 10 environments may restrict installers, background services, and cloud sync.

### MacBook development

- Do not design the MVP around local COM automation, Windows-only plug-ins, or opening AutoCAD from the developer’s MacBook.
- Build and test the core pipeline against exported fixtures: DXF, vector PDF, DAE/OBJ, supported SKP samples, and screenshots.
- Keep parsers behind adapters so a Windows conversion companion or cloud conversion service can be added later.
- Preserve original files and normalized intermediate data for reproducibility.
- Maintain a small cross-platform fixture set checked into the development environment where licensing permits.
- Test final export steps on the actual Windows 10 workstation before claiming workflow compatibility.

### Recommended MVP architecture

- Browser-based front end for review and comparison.
- Server or local service for parsing, normalization, matching, and report generation.
- Format adapters rather than format-specific business logic.
- Canonical internal geometry in metres with explicit source-unit conversion.
- Stable internal IDs plus geometric fingerprints; do not assume persistent IDs across exports.
- Deterministic results for the same inputs and tolerance settings.
- Manual tracing/alignment fallback for every automated ingestion step.

### Geometry-matching approach

Start with transparent heuristics rather than an opaque model:

1. Restrict candidates by building, storey, and façade.
2. Normalize coordinates onto a façade plane.
3. Compare centroid distance, width, height, sill/head elevation, and sequence along the wall.
4. Compute a weighted match score.
5. Use conservative thresholds for automatic matches.
6. Send uncertain one-to-many or many-to-one cases to manual review.
7. Learn nothing from an override unless the product explicitly records and scopes that behaviour.

---

## 12. Assumptions to validate with users

The case study may proceed with these hypotheses, but should label them as assumptions:

- The plan is usually the more reliable source for window location and width during early design.
- The SketchUp model provides useful height, sill/head, and façade context.
- Teams can export vector PDF/DXF and DAE/OBJ even when direct native parsing is unavailable.
- Window objects have enough consistency to detect or trace without modelling the whole building.
- The principal user recognizes façade and storey structure and can correct mappings quickly.
- Early warnings are valuable even when the final code analysis remains manual.
- The user will tolerate a short alignment step if the result prevents downstream rework.
- A comparison report is a credible bridge to an architect or code consultant.
- The initial target is a narrow class of Québec residential condominium projects, not all residential buildings.

### Research questions

- Which file is considered authoritative at each project phase?
- What export formats are actually available in the office’s installed versions?
- How are windows drawn and named in both tools?
- At what point is exposing-building-face analysis currently performed, and by whom?
- What event usually triggers recalculation?
- Is the calculation organized by full façade, storey, fire compartment, or another permitted subdivision?
- Which discrepancies are costly enough to interrupt work immediately?
- What evidence does a reviewer need to trust a warning?
- What false-positive rate is acceptable?
- Can anonymized project samples be obtained for testing?

---

## 13. Design direction

### Product character

Fitte should feel like a precise architectural review instrument: calm, spatial, legible, and evidence-led. It should not look like a generic SaaS analytics dashboard or a futuristic AI command centre.

### Visual principles

- Let drawings and geometry occupy most of the canvas.
- Use a warm neutral base reminiscent of trace paper and printed drawing sets.
- Use colour sparingly to express source, difference, confidence, and review state.
- Prefer crisp linework, measured spacing, and compact technical labels.
- Show hierarchy through scale and whitespace rather than heavy cards everywhere.
- Pair a humanist sans-serif interface face with tabular numerals and a restrained mono style for dimensions/IDs.
- Keep status language direct: “Resized 240 mm,” “Missing from model,” “Input required.”
- Animate only to preserve spatial context—for example, when selecting a discrepancy in the list highlights it in both views.

### Trust principles

- Always show the source and derivation of consequential values.
- Explain why a pair was matched.
- Keep the original evidence one click away.
- Make uncertainty visible.
- Allow correction before calculation.
- Separate geometry findings from code interpretation visually and semantically.
- Never use an AI sparkle icon as a substitute for an explanation.

---

## 14. Agent repivot instructions

### Objective

Redesign the existing Fitte project around the single end-to-end story of window coordination and early façade-opening impact detection. Preserve useful foundations, but remove or demote anything that weakens this story.

### Implementation order

1. **Audit the existing product**
   - Inventory routes, screens, components, data models, and reusable design tokens.
   - Identify anything coupled to Unit DNA, Office DNA, or generic version control.
   - Preserve user work and avoid destructive rewrites until replacements are functional.

2. **Rewrite the narrative shell**
   - Replace the headline/value proposition with the core promise in this brief.
   - Make the latest window comparison the primary project action.
   - Demote broad platform language to a future-vision note, if retained at all.

3. **Create the new domain model**
   - Add projects, buildings, revisions, storeys, façades/review portions, window candidates, matches, discrepancies, code-input sets, and assessments.
   - Add provenance and confidence to imported/inferred values.
   - Version all provisional rule logic.

4. **Build a deterministic demo data set**
   - Use one fictional Québec condominium project.
   - Provide a baseline and current revision.
   - Include at least: one resized window, one moved window, one plan-only window, one model-only window, and one ambiguous match.
   - Make one façade’s opening area change enough to generate a review warning.
   - Label all code inputs as fictional/provisional.

5. **Build the comparison workspace first**
   - Implement list-to-viewer linked selection.
   - Implement baseline/current geometry overlays.
   - Implement issue classification, confidence, and manual resolution.
   - Ensure the value is understandable before adding secondary screens.

6. **Add the façade impact panel**
   - Aggregate confirmed geometry.
   - Require explicit project inputs.
   - Show formulas, assumptions, missing inputs, and warning rationale.
   - Use review states instead of pass/fail compliance.

7. **Add import/alignment as a believable prototype**
   - If real parsing is not yet implemented, use a clearly labelled staged import backed by fixture data.
   - Do not fake invisible certainty: surface manual alignment and correction controls.

8. **Create the report/handoff view**
   - Include evidence, deltas, assumptions, unresolved items, and reviewer status.
   - Make the exported output useful in an actual design-review conversation.

9. **Remove distractions**
   - Hide incomplete Office DNA / Unit DNA screens from primary navigation.
   - Remove metrics unrelated to the coordination decision.
   - Avoid expanding into unrelated code checks.

10. **Verify the product story**
    - A first-time viewer should understand in under 30 seconds what changed, where it changed, and why it matters.
    - The complete scripted flow should take 3–5 minutes.
    - At no point should the prototype imply that it replaces professional code review.

### Suggested demo script

1. “A technician revised several east-facing windows in the plan.”
2. Upload/select the latest AutoCAD and SketchUp exports.
3. Fitte finds seven discrepancies.
4. Select a resized living-room window and show linked evidence.
5. Accept two high-confidence matches and correct one ambiguous match.
6. Open the east-façade impact panel.
7. Show the aggregate opening-area increase and the provisional warning.
8. Display the explicit inputs and explain which ones require confirmation.
9. Assign the issue to the project architect and export the review report.
10. End on the outcome: the team found a potentially consequential change before further drawings and modelling were completed.

---

## 15. Acceptance criteria

The repivot is successful when:

- The primary navigation and landing state lead directly to a window comparison.
- The prototype supports baseline and current 2D/3D revisions.
- At least five distinct discrepancy examples are visible and reviewable.
- Selecting an issue highlights corresponding evidence in both representations.
- The user can correct an automatic match.
- Confirmed changes roll up to a façade/review-portion summary.
- The UI shows baseline, current, and delta opening areas.
- Missing code inputs block a threshold claim and produce an informative state.
- Any threshold assessment is clearly marked provisional and names its assumptions.
- The user can request/record professional review and export a report.
- Unit DNA / Office DNA no longer competes with the primary story.
- The full experience works in a modern browser on the MacBook development machine.
- The input/export story remains credible for a Windows 10 office using AutoCAD LT 2025 and SketchUp 2015/2018.

---

## 16. Future opportunities—not part of this repivot

Once the focused workflow has been validated, Fitte could expand into:

- Additional opening types and elevation coordination.
- Native add-ins or a watched-folder workflow.
- More robust DWG/SKP/IFC ingestion.
- Change requests that link back to drawing/model authors.
- Other early code-impact signals.
- Project-to-project pattern reuse.
- A reintroduced Unit DNA for repeatable residential layouts.
- An Office DNA layer for validated standards and review knowledge.

These should be earned by evidence from the core workflow, not built in advance.

---

## 17. Reference context

Use the currently applicable official Québec requirements and the project’s authority having jurisdiction for real work. The references below support the product framing only; they do not define a complete calculation method.

- Gouvernement du Québec, **Règlement de construction — Guide La prise de décision en urbanisme**: explains the relationship between Québec construction requirements and municipal rules, including the possibility of stricter municipal requirements.  
  <https://www.quebec.ca/habitation-territoire/amenagement-developpement-territoires/amenagement-territoire/guide-prise-decision-urbanisme/reglementation/reglement-construction>
- National Research Council Canada, **National Building Code of Canada 2015, Division B, Section 3.2.3**: background on spatial separation, exposing building faces, limiting distance, and aggregate unprotected-opening area.  
  <https://nrc-publications.canada.ca/eng/view/ft/?dp=2&dsl=en&id=c8876272-9028-4358-9b42-6974ba258d99>
- National Research Council Canada, **Illustrated User’s Guide — NBC 2015: Part 9 of Division B**: examples showing how exposing-building-face areas, limiting distances, and permitted openings interact.  
  <https://nrc-publications.canada.ca/eng/view/ft/?id=72431bc3-7a2e-4725-bdca-aace4b7f3837>

> **Final caution:** Before implementing any production calculation, confirm the governing code edition, Québec amendments, project classification, municipal requirements, calculation method, and all geometric inputs with a qualified Québec professional. Fitte’s MVP is an early coordination and triage tool—not a substitute for that determination.
