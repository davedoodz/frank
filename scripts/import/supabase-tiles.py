#!/usr/bin/env python3
"""Render one plan PDF into a public Supabase tile pyramid.

The source PDF is uploaded to the private ``drawing-originals`` bucket. The
viewer reads only the public ``drawing-tiles`` files: a small preview, a
manifest, and 512 px WebP tiles at progressively sharper levels.

Usage:
  python3 scripts/import/supabase-tiles.py \
    public/prototypes/assets/plan-niveau-5.pdf plan-niveau-5

Required in .env.local (never commit these):
  NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<service-role-secret>
"""
from __future__ import annotations

import argparse
import io
import json
import math
import os
import tempfile
from pathlib import Path
from typing import Iterator
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

import fitz  # PyMuPDF
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = ROOT / ".env.local"
ORIGINAL_BUCKET = "drawing-originals"
TILE_BUCKET = "drawing-tiles"
PROJECT = "baldwin-iii"
TILE_SIZE = 512
PREVIEW_WIDTH = 1600
MAX_WIDTH = 12288
WEBP_QUALITY = 90


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def env_value(name: str, values: dict[str, str]) -> str:
    value = os.environ.get(name) or values.get(name)
    if not value:
        raise SystemExit(f"Missing {name}. Add it to {ENV_PATH} or the shell environment.")
    return value


def public_path(drawing: str, *parts: str) -> str:
    return "/".join((PROJECT, drawing, *parts))


def upload(url: str, key: str, bucket: str, path: str, body: bytes, content_type: str, cache_control: str) -> None:
    endpoint = f"{url.rstrip('/')}/storage/v1/object/{quote(bucket + '/' + path, safe='/')}"
    request = Request(
        endpoint,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {key}",
            "apikey": key,
            "Content-Type": content_type,
            "x-upsert": "true",
            "cache-control": cache_control,
        },
    )
    try:
        with urlopen(request) as response:
            if response.status not in (200, 201):
                raise SystemExit(f"Upload failed for {path}: HTTP {response.status}")
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Upload failed for {path}: HTTP {error.code} {detail}") from error


def level_widths(max_width: int) -> list[int]:
    widths = [768]
    while widths[-1] < max_width:
        widths.append(min(max_width, widths[-1] * 2))
    return widths


def tile_bytes(page: fitz.Page, clip: fitz.Rect, scale: float) -> bytes:
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=clip, alpha=False)
    image = Image.open(io.BytesIO(pixmap.tobytes("png"))).convert("RGB")
    output = io.BytesIO()
    image.save(output, "WEBP", quality=WEBP_QUALITY, method=6)
    return output.getvalue()


def tile_jobs(page: fitz.Page, width: int) -> Iterator[tuple[int, int, bytes]]:
    scale = width / page.rect.width
    height = math.ceil(page.rect.height * scale)
    columns = math.ceil(width / TILE_SIZE)
    rows = math.ceil(height / TILE_SIZE)
    for row in range(rows):
        for column in range(columns):
            x0, y0 = column * TILE_SIZE, row * TILE_SIZE
            x1, y1 = min(width, x0 + TILE_SIZE), min(height, y0 + TILE_SIZE)
            clip = fitz.Rect(x0 / scale, y0 / scale, x1 / scale, y1 / scale)
            yield column, row, tile_bytes(page, clip, scale)


def preview_bytes(page: fitz.Page) -> bytes:
    scale = PREVIEW_WIDTH / page.rect.width
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    image = Image.open(io.BytesIO(pixmap.tobytes("png"))).convert("RGB")
    output = io.BytesIO()
    image.save(output, "WEBP", quality=WEBP_QUALITY, method=6)
    return output.getvalue()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="single-page, cropped plan PDF")
    parser.add_argument("drawing", help="stable drawing slug, for example plan-niveau-5")
    parser.add_argument("--supabase-url", help="public Supabase project URL; otherwise read NEXT_PUBLIC_SUPABASE_URL")
    parser.add_argument("--max-width", type=int, default=MAX_WIDTH)
    args = parser.parse_args()

    source = args.source.resolve()
    if source.suffix.lower() != ".pdf":
        raise SystemExit("Source must be a cropped, single-page PDF.")
    if not source.is_file():
        raise SystemExit(f"Missing source PDF: {source}")

    env = load_env(ENV_PATH)
    supabase_url = args.supabase_url or env_value("NEXT_PUBLIC_SUPABASE_URL", env)
    service_role_key = env_value("SUPABASE_SERVICE_ROLE_KEY", env)

    document = fitz.open(source)
    if document.page_count != 1:
        raise SystemExit("Source must contain exactly one page. Crop it before generating tiles.")
    page = document[0]
    max_width = max(768, args.max_width)
    source_path = public_path(args.drawing, "source.pdf")
    tile_root = public_path(args.drawing)

    upload(supabase_url, service_role_key, ORIGINAL_BUCKET, source_path, source.read_bytes(), "application/pdf", "31536000")
    upload(supabase_url, service_role_key, TILE_BUCKET, public_path(args.drawing, "preview.webp"), preview_bytes(page), "image/webp", "31536000")

    levels = []
    for level, width in enumerate(level_widths(max_width)):
        height = math.ceil(page.rect.height * width / page.rect.width)
        columns, rows = math.ceil(width / TILE_SIZE), math.ceil(height / TILE_SIZE)
        levels.append({"level": level, "width": width, "height": height, "columns": columns, "rows": rows})
        for column, row, body in tile_jobs(page, width):
            path = public_path(args.drawing, str(level), f"{column}_{row}.webp")
            upload(supabase_url, service_role_key, TILE_BUCKET, path, body, "image/webp", "31536000")
        print(f"uploaded level {level}: {columns} × {rows} tiles")

    manifest = {
        "version": 1,
        "drawing": args.drawing,
        "tileSize": TILE_SIZE,
        "preview": "preview.webp",
        "levels": levels,
    }
    upload(
        supabase_url,
        service_role_key,
        TILE_BUCKET,
        public_path(args.drawing, "manifest.json"),
        json.dumps(manifest, separators=(",", ":")).encode(),
        "application/json",
        "300",
    )
    document.close()
    print(f"uploaded {tile_root}/manifest.json")


if __name__ == "__main__":
    main()
