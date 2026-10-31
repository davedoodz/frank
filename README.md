# Frank

A coordination workspace for architecture offices. One screen holds a condo project's floor plans, the consultants' drawings layered over them, the 3D building model, the unit schedule, and the team's comments, so a question about unit 507 is answered where unit 507 is drawn.

**[Live prototype](https://hey-its-frank.vercel.app/)**

The project shown, Le Baldwin III, is fictional. The interface is in Québec French because the drawings are.

## What it does

- **Plans that stay sharp.** Each drawing is pre-rendered from its PDF into a tile pyramid. Zooming to 930 % swaps in sharp tiles in about a second instead of rendering the PDF in the browser.
- **Consultant layers.** The surveyor, landscape, electrical, plumbing and ventilation sheets sit over the architect's plan. Each one can be shown, hidden or faded.
- **Units in 2D and 3D.** Selecting a unit in the schedule highlights it on the plan and in the building model.
- **Comments pinned to the drawing.** A note can point to a spot on the plan and is either internal or shared with the team.
- **Codes beside the work.** The Québec construction code and the zoning by-law articles that apply to the project, with figures.

## Stack

Next.js on Vercel. Supabase Storage holds the tile pyramids and the original drawings. The plan viewer and 3D pane are plain JavaScript with three.js, and the building model is meshopt-compressed with WebP textures.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`; it redirects to the prototype. Set `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` to load the drawing tiles (see `.env.example`).

Publish a drawing's tiles with `python3 scripts/import/supabase-tiles.py <pdf> <name> --supabase-url <url>`. This needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, which is never committed.

## Map

| Path | What's there |
| --- | --- |
| `public/prototypes/prototype 3.html` | The prototype |
| `public/prototypes/wireframe-c3-*.js` | Plan tiles, PDF fallback, 3D viewer, unit selection |
| `scripts/import/` | Tile publishing and image conversion |
| `app/` | Next.js routes, including the storage config endpoint |
| `CONTEXT.md`, `PRD.md`, `DESIGN.md` | Product context, requirements and design rules |
