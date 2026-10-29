#!/usr/bin/env python3
"""Cut the non-residential architectural sheets out of the permit set.

Levels 1-8 already have plan-niveau-N.{pdf,jpg} in
public/prototypes/assets. The two basements and the roof had no
architectural source at all, so the 2D pane fell back to a consultant's
sheet. These three pages are the architect's own drawing for those
levels, cut the same way the floor sheets were: the page is kept as it
is, the titleblock column is cropped off at the same x, and the preview
JPG is rasterised from that crop at the same 2000x1675 canvas.

Nothing is redrawn: the PDF keeps the original page content, so the
vector pass in the browser reads real linework.

Usage: python3 scripts/import/arch-plans.py
"""
from __future__ import annotations

import io
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "lafondarchitecte-projects" / "AU 11 AOUT 2026 - POUR PERMIS EN ATTENTE - BALDWIN III.pdf"
OUT = ROOT / "public/prototypes/assets"

# Measured off the existing plan-niveau-N.pdf: page is 3456 x 2592 pt and
# the kept crop is 3095 wide, which drops the cartouche column and nothing
# else.
CROP_W, CROP_H = 3095.0, 2592.0
CANVAS_W, CANVAS_H = 2000, 1675
JPEG_QUALITY = 86

# page number (1-based, as read in a viewer) -> output stem, sheet code
SHEETS = [
    (9, "plan-sous-sol-0", "A-202"),    # PLAN DU NIVEAU 0
    (11, "plan-sous-sol-00", "A-203"),  # PLAN DU NIVEAU 00
    (22, "plan-toiture", "A-213"),      # PLAN DU NIVEAU 9 - toiture
]


def main() -> None:
    doc = fitz.open(SRC)
    for pno, stem, code in SHEETS:
        page = doc[pno - 1]
        clip = fitz.Rect(0, 0, CROP_W, CROP_H)

        out = fitz.open()
        dst = out.new_page(width=CROP_W, height=CROP_H)
        dst.show_pdf_page(dst.rect, doc, pno - 1, clip=clip)
        out.save(OUT / f"{stem}.pdf", garbage=4, deflate=True)
        out.close()

        pm = page.get_pixmap(clip=clip, matrix=fitz.Matrix(CANVAS_W / CROP_W, CANVAS_W / CROP_W))
        img = Image.open(io.BytesIO(pm.tobytes("png"))).convert("RGB")
        canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), "white")
        canvas.paste(img, (0, (CANVAS_H - img.height) // 2))
        canvas.save(OUT / f"{stem}.jpg", quality=JPEG_QUALITY, optimize=True)
        print(f"page {pno} -> {stem}.pdf / {stem}.jpg  ({code})")
    doc.close()


if __name__ == "__main__":
    main()
