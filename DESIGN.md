# DESIGN.md: fitte visual direction

Read after CONTEXT.md. This file governs every interface decision. When a choice is not covered here, pick the denser, quieter option.

Two kinds of screen exist. **fitte web** screens use the tokens below. **Simulated host screens** (AutoCAD, SketchUp) use the host's chrome, and fitte's tokens apply only inside the palette or tray body. See "Host chrome" at the end.

## Register

Design-research tool, not a SaaS landing page. The reference is a drawing sheet with a schedule beside it, and an intelligent library for the office's past work. The interface is a frame around a plan. It never competes with the plan.

No gradients. No shadows deeper than 1 px. No rounded corners above 2 px. No illustrations. No emoji. No marketing copy anywhere, including empty states, placeholders, and the login page.

## Color

Near-monochrome. Plans are black linework on white, so the interface is grayscale with one accent, plus a muted typology palette used only as fills on the plan.

```
--paper:      #FFFFFF   plan background, always pure white
--surface:    #F4F4F2   app background, warm gray
--line:       #D9D9D5   borders, dividers, unverified outlines, 1 px
--ink:        #111111   primary text, verified outlines, hovered outlines
--ink-2:      #6B6B66   secondary text, labels
--ink-3:      #A3A39E   disabled, low-confidence values, placeholders
--accent:     #C8411B   selected unit, active filter, one use per screen max
--accent-08:  rgba(200, 65, 27, 0.08)   selected unit fill

typology fills, 12 percent alpha on the plan, full value in the legend swatch:
--t-studio:   #8A8A85
--t-3h:       #5B7A99   (3½)
--t-4h:       #6F8F5E   (4½)
--t-5h:       #A3733F   (5½)
--t-other:    #B06A8A
```

Low confidence (under 0.7) uses `--ink-3` with a 1 px dotted underline in `--ink-3`. Never red. Uncertainty is information, not an error.

Status words (`verified`, `unverified`, `CAD update available`, `drawing updated`) are text in 11 px monospace `--ink-2`. No colored badges. No icons.

Dark mode: not this week.

## Type

Two faces.

- **Interface and labels:** a grotesk with tabular numerals. Inter, or the system stack `-apple-system, "Helvetica Neue", Arial`. Sizes: 11 px labels, 13 px body, 15 px panel title, 20 px unit number in the panel header.
- **Numbers and codes:** a monospace for unit numbers, areas, sheet numbers, filenames, project codes, confidences, status words. JetBrains Mono or `ui-monospace`. 11 px in tables and on the plan, 13 px in the panel. Tabular.

Line height 1.4. Letter spacing 0 except 11 px uppercase labels at +0.04 em. Uppercase only for panel section labels and table headers.

## Layout, fitte web

- Fixed 48 px top bar, 1 px `--line` bottom border. Left: wordmark `fitte.` 13 px, then project display name 13 px `--ink` and project code 11 px monospace `--ink-2`. Center: workspace tabs `units`, `office dna`, `drawings`, `building`, 13 px, active underlined 1 px `--ink`. Right: schedule toggle, search.
- **Plan view.** Left rail 200 px (building navigation), 1 px right border. Viewer fills the middle. Right panel 360 px, 1 px left border, scrolls independently. Viewer background `--surface`. The plan image sits on `--paper`.
- **Schedule.** Summary strip 64 px. Filter bar 40 px. Table fills the rest, header sticky, floor group rows sticky under the header.
- **Office DNA (R3).** Search chips 40 px under the top bar. Results as a grid of cells, gap 1 px `--line`, minimum 4 columns at 1280 px, 5 at 1920 px. Each cell: plan crop on `--paper`, 12 px padding, one caption line under it.
- **Compare (R3).** Two viewers side by side, 1 px divider. Toolbar 40 px above with overlay toggles. Attribute table below, 28 px rows, difference cells in `--ink` bold against `--ink-2` for matching values.
- **Dashboard.** A table, not cards. 32 px rows. Columns: name, code, city, year, floors, units, verified, last import.
- 8 px base spacing. Only 4, 8, 12, 16, 24, 48.

## Components

**Unit outline (on the plan).** SVG polygon. Unverified rest: 1 px `--line`. Verified rest: 1 px `--ink`. Hover: 1 px `--ink`. Selected: 1.5 px `--accent`, fill `--accent-08`. All-units view: fill with the typology color at 12 percent, stroke per status. Stroke width never scales with zoom (`vector-effect: non-scaling-stroke`). No transition on stroke, 80 ms on fill.

**Unit label (on the plan).** Unit number, 11 px monospace `--ink-2`, on a white 2 px padded rect. Selected: `--accent`. Hidden under 0.5x if labels collide.

**Left rail item.** 28 px, 13 px text, floor label with unit count in monospace `--ink-2`. Expanded floor lists unit numbers in a 4-column monospace grid, 24 px rows. Current item: 2 px left border `--accent`, no fill.

**Chip.** 24 px tall, 1 px border `--line`, text `--ink-2`, count in monospace after a middle dot. Active: border and text `--accent`, no fill. Zero count: `--ink-3`, still clickable. Editable search chips (R3): the value is the chip text, click to edit inline.

**Panel header.** Unit number 20 px monospace `--ink`. Beside it the type 13 px (`4½`). Status word at the right in 11 px monospace `--ink-2`. Under it, one 11 px `--ink-2` line: floor, sheet, revision date, source filename.

**Panel row.** Label 11 px uppercase `--ink-2`, value 13 px `--ink`, 4 px between, 16 px between rows. Area shows m² first and ft² after in `--ink-2`. Confidence on hover of a low-confidence value as an 11 px monospace number. Not a bar. Not a color scale. Editable (R2): click the value, it becomes an input with a 1 px `--ink` bottom border, no box.

**Panel footer.** Two text actions, 13 px, `--ink`, separated by a middle dot: `find similar units · edit`. Disabled: `--ink-3` with a tooltip naming the round. R2 adds `verify unit`. R3 adds `open in autocad` and `add to collection` on archived units.

**Sync notice.** One line at the top of the panel or the floor, 11 px monospace `--ink-2`, 1 px `--line` bottom border: `drawing updated · refresh unit data` or `CAD update available · review`. Text link, no button.

**Table.** Row height 28 px. 1 px `--line` between rows. Header 11 px uppercase `--ink-2`. Numbers right-aligned monospace. Low-confidence cells muted dotted. Hover row: background `--paper`. Floor group row: 32 px, `--surface`, label left, subtotal right. Total row: 1 px `--ink` top border.

**Summary strip.** Figures in a row: units, verified, studio, 3½, 4½, 5½, total net m². Each 20 px monospace `--ink` over an 11 px uppercase label `--ink-2`. 1 px `--line` dividers. No boxes.

**Result cell (R3).** Plan crop on white, caption line: project display name · year · unit number · area · type, 11 px, then the match basis in monospace `--ink-2` on a second line. Hover: 1 px inset outline `--ink`. No shadow, no scale.

**Placeholder tab.** One line, 13 px `--ink-3`, centered vertically: `available in a later round`. Nothing else.

**Login.** One input, one button, centered. `fitte.` above. Nothing else.

## Motion

Nearly none. Filter changes swap content with no animation. Selecting a unit changes fill in 80 ms. Floor and tab switches are route changes. Compare toggles are instant. That is all.

## Plans

- Rasterize at 200 dpi. Serve PNG or WebP lossless. No compression artifacts on linework.
- Never apply a filter, tint, or border to a plan. Typology fills are overlays, never recolored linework.
- Normalize an off-white scan to pure white during import with a levels adjustment, not a blur.
- Zoom 1x to 6x, continuous. Pan is drag. Double click resets to fit. Fit means the whole floor visible with 24 px margin.
- Mask the title block during import. Masked area is `--paper`, not a gray box.
- Compare (R3): both plans at the same real-world scale from `px_per_m`. Orientation preserved by default.

## Host chrome, simulated screens

Simulated screens must be mistaken for the host app at a glance. Screenshot the real AutoCAD and SketchUp sessions on the technicians' machines and match them.

**AutoCAD (routes `/sim/autocad/...`).**
- Full viewport in AutoCAD's dark theme. Model space background `#212830` or sampled from the screenshot. Ribbon, command line, status bar, layout tabs reproduced as static images or flat HTML. Do not redraw the ribbon by hand if a cropped screenshot can be used.
- The real floor plan rendered as light linework on the dark background (invert the rasterized plan, or use the DXF rendered with white lines).
- Docked palette on the right, 320 px, with AutoCAD's palette title bar (vertical title strip, auto-hide and properties icons). Inside the palette body, fitte's tokens on `--surface`, 11 and 13 px type, same panel rows as the web.
- Selected unit on the plan: translucent blue fill `rgba(60, 140, 255, 0.25)` with a 1 px `#3C8CFF` stroke. This is the host's selection convention, not fitte's accent. Proposed outlines from `analyze units`: same blue at 15 percent, dashed stroke.
- Floating review panel: AutoCAD-style small dialog, flat, `#2B2F36` background, 12 px Segoe UI or system sans.
- A `simulated` label, 11 px monospace, bottom-left corner of the viewport, `--ink-3` on dark.

**SketchUp (routes `/sim/sketchup/...`).**
- Light theme. Viewport with SketchUp's default sky-and-ground gradient or a flat `#F0F0F0`, axes visible. Toolbar from a cropped screenshot.
- The massing model as a static render or screenshot from the real SKP, with the selected level band outlined in SketchUp's selection blue `#4A90E2`, 2 px.
- Tray panel on the right, 280 px, SketchUp tray header style. Inside, fitte tokens on `--surface`.
- `simulated` label, bottom-left.

**Handoffs.** Every button that crosses an environment is a real link: `open full unit dna`, `publish to fitte`, `view units in fitte`, `find similar units` go to the real web routes with the unit in the URL. `open in autocad` and `open original dwg` from the web go to the simulated AutoCAD route. The handoff table in CONTEXT.md is the contract.

## References to look at before coding

- A unit schedule printed on an A1 sheet beside the plan. That density, that hierarchy.
- Bluebeam's measurement panel beside a plan: numbers attached to regions.
- AutoCAD's Properties palette: how a dense dark palette sits beside a drawing.
- Linear's filter chips: count, AND logic, active state with no fill.
- A land registry cadastral plan: outlines, numbers, nothing else.

Do not look at Pinterest, Notion, or any dashboard template.
