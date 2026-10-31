#!/usr/bin/env python3
"""Write the WebP copies Prototype 3 loads instead of its PNG and JPEG sources.

Each source keeps its file; the page reads the `.webp` written next to it.
Thumbnails for the layer strip and the minimap go to `assets/thumbs/` at
THUMB_WIDTH, enough for a 3x screen at the size those tiles are drawn.

Run again after replacing any source image:

  python3 scripts/import/web-images.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ASSETS = Path(__file__).resolve().parents[2] / "public" / "prototypes" / "assets"
THUMBS = ASSETS / "thumbs"
THUMB_WIDTH = 480
QUALITY = 84
# Code figures carry small type; they keep more detail than photos.
FIGURE_QUALITY = 88

FULL = [
    "baldwin-cover.png",
    "skp-facade.jpg",
    "skp-ensemble.jpg",
    "ouvertures-fenetres.jpg",
    "ouvertures-portes.jpg",
    *sorted(str(p.relative_to(ASSETS)) for p in (ASSETS / "engineering").glob("*.jpg")),
]
FIGURES = sorted(str(p.relative_to(ASSETS)) for p in (ASSETS / "code").glob("*.png"))
THUMB_SOURCES = [
    *sorted(p.name for p in ASSETS.glob("plan-*.jpg")),
    "arp-site.png",
    "paysage.png",
    *sorted(str(p.relative_to(ASSETS)) for p in (ASSETS / "engineering").glob("*.jpg")),
]


def save(image: Image.Image, target: Path, quality: int) -> int:
    target.parent.mkdir(parents=True, exist_ok=True)
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
    image.save(target, "WEBP", quality=quality, method=6)
    return target.stat().st_size


def main() -> None:
    before = after = 0
    for name, quality in [*((n, QUALITY) for n in FULL), *((n, FIGURE_QUALITY) for n in FIGURES)]:
        source = ASSETS / name
        before += source.stat().st_size
        after += save(Image.open(source), source.with_suffix(".webp"), quality)
    for name in THUMB_SOURCES:
        image = Image.open(ASSETS / name)
        height = round(image.height * THUMB_WIDTH / image.width)
        thumb = image.resize((THUMB_WIDTH, height), Image.Resampling.LANCZOS)
        save(thumb, (THUMBS / name).with_suffix(".webp"), QUALITY)
    print(f"full-size: {before / 1e6:.1f} MB -> {after / 1e6:.1f} MB; {len(THUMB_SOURCES)} thumbnails")


if __name__ == "__main__":
    main()
