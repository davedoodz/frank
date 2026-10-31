#!/usr/bin/env python3
"""Prepare per-sheet electrical/mechanical engineering assets for fitte.

Reads the two permit-set PDFs under lafondarchitecte-projects/, crops and
registers each requested sheet against the existing architectural floor
JPGs (public/prototypes/assets/plan-niveau-N.jpg), and writes:

  public/prototypes/assets/engineering/<kind>-<level>.pdf   (original vectors)
  public/prototypes/assets/engineering/<kind>-<level>.jpg   (full raster preview)
  public/prototypes/assets/engineering/sheets.js            (window.fitteEngineering manifest)

The manifest points at the WebP copies of each preview and at its strip
thumbnail; write them afterwards with scripts/import/web-images.py.

Registration strategy:

  * "typical" similarity transform (uniform scale, ~0 rotation, small
    translation) is measured with SIFT + RANSAC between a full raster of a
    representative sheet (floor 5) and the matching public/.../plan-niveau-5.jpg,
    for both electrical and mechanical sources. Both sources agree to within
    ~0.02% scale and ~2px translation, so one shared transform is used for
    electrical AND all three mechanical disciplines, for levels 2-8 and roof
    (roof shares the same physical column-grid frame as the typical floors).
  * Level '1' (the ground floor) is measurably offset from the typical floors
    (~-45px x / +5px y at this scale) for both electrical and mechanical
    sources; a dedicated "ground" transform is used.
  * Basement levels '00' and '0' have no existing architectural JPG to
    register against. A "common frame" is derived once from the mechanical
    drainage sheets (the reference discipline) by fitting the union of their
    non-titleblock content bbox into the 2000x1675 canvas (uniform scale,
    letterboxed). Electrical (level '0' only) and the other two mechanical
    disciplines are then registered onto that same frame with their own
    small SIFT-measured correction (all sub-10px / scale ~1.0 -- these are
    effectively the same CAD coordinate system through a shared xref).

Privacy: the title-block column is destructively redacted from a disposable
page copy before export. Original PDF operators, fonts and line styles are
retained elsewhere; no geometry or text is reconstructed. The JPG preview
uses the same frame and masks the same title-block column.

Never writes to the source PDFs. Never prints raw PDF text.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = ROOT / "lafondarchitecte-projects"
ELEC_PDF = SRC_DIR / "25058_Métrocité - Le Baldwin III_Électricité_Permis (2026-06-19).pdf"
MECH_PDF = SRC_DIR / "25058_Métrocité - Le Baldwin III_Mécanique_Permis (2026-06-19).pdf"
OUT_DIR = ROOT / "public/prototypes/assets/engineering"

CANVAS_W, CANVAS_H = 2000, 1675
JPEG_QUALITY = 85



# ---------------------------------------------------------------------------
# Similarity transform: canvas_point = scale * source_point + (tx, ty)
# Rotation is measured negligible (<0.01 deg) everywhere -> forced to 0 so
# linework stays perfectly axis aligned ("preserve uniform scale and
# orientation").
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class Transform:
    scale: float
    tx: float
    ty: float
    note: str = ""

    def apply(self, x: float, y: float) -> tuple[float, float]:
        return (x * self.scale + self.tx, y * self.scale + self.ty)

    def compose_after(self, inner: "Transform") -> "Transform":
        """self ∘ inner : canvas = self(inner(point))"""
        return Transform(
            scale=self.scale * inner.scale,
            tx=self.scale * inner.tx + self.tx,
            ty=self.scale * inner.ty + self.ty,
            note=f"{inner.note}+{self.note}",
        )


# Measured via SIFT+RANSAC, electrical floor5 vs plan-niveau-5.jpg and
# mechanical drainage floor5 vs plan-niveau-5.jpg (8-sample average across
# electrical floors 2-8 + mech floor5; std dev ~1.2px x / 0.7px y).
T_TYPICAL = Transform(scale=0.64621425, tx=-3.5797, ty=-1.0531, note="typical(avg elec2-8+mech5 vs arch jpg, SIFT/RANSAC)")

# Measured via SIFT+RANSAC, electrical floor1 vs plan-niveau-1.jpg (41
# inliers/251 good matches) and corroborated by mechanical drainage floor1
# vs plan-niveau-1.jpg (41 inliers/275 good matches, within ~0.3px/0.1px).
T_GROUND = Transform(scale=0.646314136, tx=-44.9357979, ty=4.92400249, note="ground(elec floor1 vs arch1 jpg, SIFT/RANSAC)")

# Basement common frame: union of drainage-00 and drainage-0 non-titleblock
# content bbox (display space), fit into the 2000x1675 canvas at a single
# shared uniform scale (letterboxed vertically). Computed at script import
# time below from BASEMENT_UNION_BBOX for traceability.
BASEMENT_UNION_BBOX = (35.280029296875, 35.0400390625, 3420.9599609375, 2556.9599609375)


def _make_basement_base_transform() -> Transform:
    x0, y0, x1, y1 = BASEMENT_UNION_BBOX
    w, h = x1 - x0, y1 - y0
    scale = min(CANVAS_W / w, CANVAS_H / h)
    tx = -x0 * scale
    margin_y = (CANVAS_H - h * scale) / 2
    ty = -y0 * scale + margin_y
    return Transform(scale=scale, tx=tx, ty=ty, note="basement-base(union bbox fit, mech drainage reference)")


T_BASEMENT_BASE = _make_basement_base_transform()

# Per-discipline corrective transforms onto the mechanical-drainage basement
# frame, measured via SIFT+RANSAC between full rasters of the same basement
# level across disciplines (near-identity: scale ~0.999-1.000, translation
# <8px -- same underlying CAD coordinate system / shared xref).
T_CORR_ELEC_TO_DRAIN_0 = Transform(scale=0.999611334, tx=-2.25408060, ty=7.38758255, note="elec0->drain0 SIFT corr")
T_CORR_DIST_TO_DRAIN_00 = Transform(scale=0.999402728, tx=2.17061613, ty=0.77500503, note="dist00->drain00 SIFT corr")
T_CORR_VENT_TO_DRAIN_00 = Transform(scale=0.998845354, tx=3.27884489, ty=4.41246618, note="vent00->drain00 SIFT corr")
T_CORR_DIST_TO_DRAIN_0 = Transform(scale=0.999845729, tx=-1.16472806, ty=7.90146237, note="dist0->drain0 SIFT corr")
T_CORR_VENT_TO_DRAIN_0 = Transform(scale=0.999119270, tx=2.13262017, ty=5.92298699, note="vent0->drain0 SIFT corr")

# Roof: reuses the typical floor frame directly (shared physical column
# grid). Mechanical roof sheets are registered onto the electrical roof
# sheet (itself placed with T_TYPICAL) via SIFT (near-identity, <4px).
T_CORR_DRAIN_TO_EROOF = Transform(scale=1.00007227, tx=1.95012594, ty=1.10456873, note="drainRoof->elecRoof SIFT corr")
T_CORR_DIST_TO_EROOF = Transform(scale=1.00051841, tx=-0.13371389, ty=3.38619091, note="distRoof->elecRoof SIFT corr")
T_CORR_VENT_TO_EROOF = Transform(scale=1.00000412, tx=1.91274838, ty=2.11517019, note="ventRoof->elecRoof SIFT corr")

IDENTITY = Transform(scale=1.0, tx=0.0, ty=0.0, note="identity")


@dataclass
class SheetSpec:
    kind: str          # electrical | drainage | distribution | ventilation
    level: str          # '00' | '0' | '1'..'8' | 'roof'
    src: str            # 'elec' | 'mech'
    pno: int            # 0-based page index in source pdf
    code: str           # drawing code e.g. E-300
    page: int           # 1-based source page number
    transform: Transform
    arch_ref: str | None  # plan-niveau-N.jpg filename this registers to, else None


def floor_arch_ref(level: str) -> str | None:
    if level.isdigit() and 1 <= int(level) <= 8:
        return f"plan-niveau-{level}.jpg"
    return None


SPECS: list[SheetSpec] = []

# --- Electrical: pages 5-14 (0-idx 4-13) = SOUS-SOL0(E-300), floors1-8(E301-308), roof(E-309)
elec_levels = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "roof"]
elec_codes = ["E-300", "E-301", "E-302", "E-303", "E-304", "E-305", "E-306", "E-307", "E-308", "E-309"]
for i, (level, code) in enumerate(zip(elec_levels, elec_codes)):
    pno = 4 + i  # page5..page14 -> idx4..idx13
    SPECS.append(SheetSpec(
        kind="electrical", level=level, src="elec", pno=pno, code=code, page=pno + 1,
        transform=IDENTITY,  # placeholder, replaced below
        arch_ref=floor_arch_ref(level),
    ))

# Replace electrical transforms now that basement transform exists.
for s in SPECS:
    if s.kind != "electrical":
        continue
    if s.level == "0":
        s.transform = T_BASEMENT_BASE.compose_after(T_CORR_ELEC_TO_DRAIN_0)
    elif s.level == "1":
        s.transform = T_GROUND
    elif s.level == "roof":
        s.transform = T_TYPICAL
    else:
        s.transform = T_TYPICAL

# --- Mechanical: 3 disciplines x (00,0,1..8,roof) = 11 pages each, 3-13 / 15-25 / 26-36
mech_blocks = [
    ("drainage", 2, "M1", "M2"),       # pages 3-13 (idx2-12): 00=M199,0=M200,1..8=M201-208,roof=M209
    ("distribution", 14, "M2", "M3"),  # pages15-25 (idx14-24): 00=M299,0=M300,1..8=M301-308,roof=M309
    ("ventilation", 25, "M3", "M4"),   # pages26-36 (idx25-35): 00=M399,0=M400,1..8=M401-408,roof=M409
]
mech_levels = ["00", "0", "1", "2", "3", "4", "5", "6", "7", "8", "roof"]

for kind, start_idx, prefix_lo, prefix_hi in mech_blocks:
    for i, level in enumerate(mech_levels):
        pno = start_idx + i
        if level == "00":
            code = f"{prefix_lo}99"
        elif level == "0":
            code = f"{prefix_hi}00"
        elif level == "roof":
            code = f"{prefix_hi}09"
        else:
            code = f"{prefix_hi}0{level}"
        if level == "00":
            if kind == "drainage":
                tf = T_BASEMENT_BASE
            elif kind == "distribution":
                tf = T_BASEMENT_BASE.compose_after(T_CORR_DIST_TO_DRAIN_00)
            else:
                tf = T_BASEMENT_BASE.compose_after(T_CORR_VENT_TO_DRAIN_00)
        elif level == "0":
            if kind == "drainage":
                tf = T_BASEMENT_BASE
            elif kind == "distribution":
                tf = T_BASEMENT_BASE.compose_after(T_CORR_DIST_TO_DRAIN_0)
            else:
                tf = T_BASEMENT_BASE.compose_after(T_CORR_VENT_TO_DRAIN_0)
        elif level == "1":
            tf = T_GROUND
        elif level == "roof":
            if kind == "drainage":
                tf = T_TYPICAL.compose_after(T_CORR_DRAIN_TO_EROOF)
            elif kind == "distribution":
                tf = T_TYPICAL.compose_after(T_CORR_DIST_TO_EROOF)
            else:
                tf = T_TYPICAL.compose_after(T_CORR_VENT_TO_EROOF)
        else:
            tf = T_TYPICAL
        SPECS.append(SheetSpec(
            kind=kind, level=level, src="mech", pno=pno, code=code, page=pno + 1,
            transform=tf, arch_ref=floor_arch_ref(level),
        ))

assert len([s for s in SPECS if s.kind == "electrical"]) == 10
for k in ("drainage", "distribution", "ventilation"):
    assert len([s for s in SPECS if s.kind == k]) == 11
assert len(SPECS) == 43


# ---------------------------------------------------------------------------
# Rendering helpers
# ---------------------------------------------------------------------------

def build_vector_pdf(doc: fitz.Document, spec: SheetSpec) -> tuple[bytes, dict]:
    """Register original PDF content without reconstructing paths or text."""
    source = fitz.open()
    source.insert_pdf(doc, from_page=spec.pno, to_page=spec.pno)
    page = source[0]
    page.remove_rotation()
    tf = spec.transform
    # Remove private title-block content, not merely hide it behind a crop.
    page.add_redact_annot(fitz.Rect(CART_REDACT_X_DISPLAY, 0, page.rect.width, page.rect.height), fill=(1, 1, 1))
    page.apply_redactions(images=2, graphics=2, text=0)
    source.set_metadata({})
    out = fitz.open()
    target = out.new_page(width=CANVAS_W, height=CANVAS_H)
    target.show_pdf_page(
        fitz.Rect(tf.tx, tf.ty, tf.tx + page.rect.width * tf.scale,
                  tf.ty + page.rect.height * tf.scale),
        source, 0,
    )
    data = out.tobytes(garbage=4, deflate=True)
    out.close()
    source.close()
    return data, {"rendering": "original-pdf-content"}


# Fixed display-space x threshold (page is always 3456pt wide pre-scale)
# beyond which the titleblock/cartouche column lives on every sheet in both
# source PDFs (measured: non-titleblock content tops out around x=3054,
# cartouche graphics start around x=3086 on a clean sample page -- 3060
# gives margin on both sides). Painted white on the full-resolution raster
# BEFORE compositing, so the preview JPG can never leak the titleblock even
# when the output canvas crop window (basement frame) is wide enough to
# otherwise include it.
CART_REDACT_X_DISPLAY = 3060.0


def build_preview_jpg(page: fitz.Page, spec: SheetSpec) -> bytes:
    tf = spec.transform
    render_scale = tf.scale
    pix = page.get_pixmap(matrix=fitz.Matrix(render_scale, render_scale))
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples) if pix.n == 3 else Image.frombytes("RGBA", (pix.width, pix.height), pix.samples).convert("RGB")
    redact_x = round(CART_REDACT_X_DISPLAY * render_scale)
    if redact_x < img.width:
        from PIL import ImageDraw
        ImageDraw.Draw(img).rectangle([redact_x, 0, img.width, img.height], fill="white")
    canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), "white")
    canvas.paste(img, (round(tf.tx), round(tf.ty)))
    import io
    buf = io.BytesIO()
    canvas.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return buf.getvalue()


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    elec_doc = fitz.open(ELEC_PDF)
    mech_doc = fitz.open(MECH_PDF)

    manifest: dict[str, dict] = {"electrical": {}, "drainage": {}, "distribution": {}, "ventilation": {}}
    report = []
    total_bytes = 0

    for spec in SPECS:
        doc = elec_doc if spec.src == "elec" else mech_doc
        page = doc[spec.pno]

        pdf_bytes, meta = build_vector_pdf(doc, spec)
        jpg_bytes = build_preview_jpg(page, spec)

        base = f"{spec.kind}-{spec.level}"
        pdf_name = f"{base}.pdf"
        jpg_name = f"{base}.jpg"
        (OUT_DIR / pdf_name).write_bytes(pdf_bytes)
        (OUT_DIR / jpg_name).write_bytes(jpg_bytes)
        total_bytes += len(pdf_bytes) + len(jpg_bytes)

        alignment = "registered" if spec.arch_ref else "reference"
        sheet = {
            "img": f"assets/engineering/{base}.webp",
            "thumb": f"assets/thumbs/engineering/{base}.webp",
            "pdf": f"assets/engineering/{pdf_name}",
            "code": spec.code,
            "page": spec.page,
            "level": spec.level,
            "label": {
                "electrical": "Électricité",
                "drainage": "Mécanique - Drainage",
                "distribution": "Mécanique - Distribution",
                "ventilation": "Mécanique - Ventilation",
            }[spec.kind],
            "alignment": alignment,
            "registrationScale": round(spec.transform.scale, 6),
            "registrationTranslateX": round(spec.transform.tx, 3),
            "registrationTranslateY": round(spec.transform.ty, 3),
            "registrationMethod": spec.transform.note,
        }
        manifest[spec.kind][spec.level] = sheet

        report.append({
            "sheet": base,
            "code": spec.code,
            "sourcePage": spec.page,
            "pdfBytes": len(pdf_bytes),
            "jpgBytes": len(jpg_bytes),
            **meta,
        })
        print(f"[{base:28s}] page {spec.page:2d} ({spec.code:6s}) pdf={len(pdf_bytes)/1024:7.1f}KB jpg={len(jpg_bytes)/1024:6.1f}KB", flush=True)

    js = "window.fitteEngineering = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n"
    (OUT_DIR / "sheets.js").write_text(js, encoding="utf-8")

    report_path = OUT_DIR / "_generation-report.json"
    report_path.write_text(json.dumps({"totalOutputBytes": total_bytes, "sheets": report}, indent=2), encoding="utf-8")

    print(f"\nTotal output bytes: {total_bytes/1024/1024:.2f} MB across {len(SPECS)} sheets (pdf+jpg)")
    elec_doc.close()
    mech_doc.close()


if __name__ == "__main__":
    main()
