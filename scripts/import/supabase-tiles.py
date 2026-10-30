#!/usr/bin/env python3
"""Render one high-resolution plan source into a public Supabase tile pyramid.

PDF and raster sources are supported. Prefer the unflattened vector PDF or the
highest-resolution WebP; the output cannot recover detail absent from source.
The viewer reads only the public ``drawing-tiles`` files: a preview, manifest,
and 512 px lossless WebP tiles at progressively sharper levels.

Usage:
  python3 scripts/import/supabase-tiles.py \
    public/prototypes/assets/plan-niveau-5.pdf plan-niveau-5

Required in .env.local (never commit these):
  NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<service-role-secret>
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import os
from concurrent.futures import ThreadPoolExecutor
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
TILE_SIZE = 1024
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


def webp_bytes(image: Image.Image, *, lossless: bool) -> bytes:
    output = io.BytesIO()
    image.convert("RGB").save(output, "WEBP", lossless=lossless, quality=WEBP_QUALITY, method=6)
    return output.getvalue()


def tile_bytes(page: fitz.Page, clip: fitz.Rect, scale: float) -> bytes:
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=clip, alpha=False)
    return webp_bytes(Image.open(io.BytesIO(pixmap.tobytes("png"))), lossless=True)


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


def raster_tile_jobs(image: Image.Image, width: int) -> Iterator[tuple[int, int, bytes]]:
    scale = width / image.width
    height = math.ceil(image.height * scale)
    columns = math.ceil(width / TILE_SIZE)
    rows = math.ceil(height / TILE_SIZE)
    for row in range(rows):
        for column in range(columns):
            x0, y0 = column * TILE_SIZE, row * TILE_SIZE
            x1, y1 = min(width, x0 + TILE_SIZE), min(height, y0 + TILE_SIZE)
            crop = image.crop((x0 / scale, y0 / scale, x1 / scale, y1 / scale))
            tile = crop.resize((x1 - x0, y1 - y0), Image.Resampling.LANCZOS)
            yield column, row, webp_bytes(tile, lossless=True)


def preview_bytes(page: fitz.Page) -> bytes:
    scale = PREVIEW_WIDTH / page.rect.width
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    return webp_bytes(Image.open(io.BytesIO(pixmap.tobytes("png"))), lossless=False)


def raster_preview_bytes(image: Image.Image) -> bytes:
    height = math.ceil(image.height * PREVIEW_WIDTH / image.width)
    return webp_bytes(image.resize((PREVIEW_WIDTH, height), Image.Resampling.LANCZOS), lossless=False)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="single-page PDF or high-resolution raster plan")
    parser.add_argument("drawing", help="stable drawing slug, for example plan-niveau-5")
    parser.add_argument("--supabase-url", help="public Supabase project URL; otherwise read NEXT_PUBLIC_SUPABASE_URL")
    parser.add_argument("--max-width", type=int, default=MAX_WIDTH)
    args = parser.parse_args()
    source = args.source.resolve()

    suffix = source.suffix.lower()
    if suffix not in {".pdf", ".webp", ".png", ".jpg", ".jpeg"}:
        raise SystemExit("Source must be a single-page PDF or high-resolution raster plan.")
    if not source.is_file():
        raise SystemExit(f"Missing source drawing: {source}")

    env = load_env(ENV_PATH)
    supabase_url = args.supabase_url or env_value("NEXT_PUBLIC_SUPABASE_URL", env)
    service_role_key = env_value("SUPABASE_SERVICE_ROLE_KEY", env)

    document = None
    if suffix == ".pdf":
        document = fitz.open(source)
        if document.page_count != 1:
            raise SystemExit("Source PDF must contain exactly one page. Crop it before generating tiles.")
        page = document[0]
        source_width, source_height = page.rect.width, page.rect.height
        preview = preview_bytes(page)
        jobs_for = tile_jobs
        render_source = page
        content_type = "application/pdf"
    else:
        raster = Image.open(source).convert("RGB")
        source_width, source_height = raster.size
        preview = raster_preview_bytes(raster)
        jobs_for = raster_tile_jobs
        render_source = raster
        content_type = "image/webp" if suffix == ".webp" else f"image/{suffix[1:]}"

    max_width = max(768, args.max_width) if suffix == ".pdf" else min(max(768, args.max_width), math.ceil(source_width))
    source_bytes = source.read_bytes()
    tile_version = hashlib.sha256(source_bytes + f":{max_width}:{TILE_SIZE}:opaque-v1".encode()).hexdigest()[:16]
    source_path = public_path(args.drawing, f"source{suffix}")
    tile_root = public_path(args.drawing)
    versioned_tile_root = public_path(args.drawing, "v", tile_version)

    upload(supabase_url, service_role_key, ORIGINAL_BUCKET, source_path, source_bytes, content_type, "31536000")
    upload(supabase_url, service_role_key, TILE_BUCKET, f"{versioned_tile_root}/preview.webp", preview, "image/webp", "31536000")

    levels = []
    with ThreadPoolExecutor(max_workers=4) as workers:
        for level, width in enumerate(level_widths(max_width)):
            height = math.ceil(source_height * width / source_width)
            columns, rows = math.ceil(width / TILE_SIZE), math.ceil(height / TILE_SIZE)
            levels.append({"level": level, "width": width, "height": height, "columns": columns, "rows": rows})
            jobs = (
                (
                    supabase_url,
                    service_role_key,
                    TILE_BUCKET,
                    f"{versioned_tile_root}/{level}/{column}_{row}.webp",
                    body,
                    "image/webp",
                    "31536000",
                )
                for column, row, body in jobs_for(render_source, width)
            )
            list(workers.map(lambda job: upload(*job), jobs))
            print(f"uploaded level {level}: {columns} × {rows} tiles")

    manifest = {
        "version": tile_version,
        "drawing": args.drawing,
        "tilePath": f"v/{tile_version}",
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
    if document:
        document.close()
    print(f"uploaded {tile_root}/manifest.json")


if __name__ == "__main__":
    main()
