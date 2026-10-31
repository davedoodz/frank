#!/usr/bin/env python3
"""Deploy the Frank case-study deck to https://frank-case-study.vercel.app.

The deck's wording, slide order, deleted slides, section names and DialKit
settings live in the browser's localStorage, not in the HTML. This script:

1. reads that state from Chrome's on-disk localStorage for the origin the deck
   is edited on (default http://localhost:3101), read-only, without opening
   Chrome, and saves it to public/prototypes/assets/frank/deck-state.json;
2. builds a static copy of public/prototypes and public/explorations in a
   temporary folder;
3. in that copy only, seeds the saved state into localStorage before the deck
   runs, and replaces DialKit with a stub that holds the saved settings (no
   panel, no edit mode); other pages that load DialKit get their panel hidden;
4. deploys the folder to the Vercel project `frank-case-study` (production).

Usage: python3 scripts/deploy-frank-deck.py [--origin http://localhost:3101]
       [--no-chrome] [--no-deploy]
"""
import argparse, glob, json, os, pathlib, shutil, struct, subprocess, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
STATE = PUBLIC / "prototypes/assets/frank/deck-state.json"
CHROME_LS = pathlib.Path.home() / "Library/Application Support/Google/Chrome/Default/Local Storage/leveldb"
KEYS = ["frank-deck-edits-v2", "frank-deck-order-v2", "frank-deck-order-v1",
        "frank-deck-sections-v1", "frank-deck-deleted-v1", "dialkit:frank-deck-r1"]


# ---------------------------------------------------------------- Chrome's leveldb, read-only
def varint(b, i):
    r = s = 0
    while True:
        c = b[i]; i += 1; r |= (c & 0x7F) << s; s += 7
        if c < 0x80:
            return r, i


def snappy(src):
    _, i = varint(src, 0); out = bytearray()
    while i < len(src):
        tag = src[i]; i += 1; t = tag & 3
        if t == 0:
            ln = tag >> 2
            if ln >= 60:
                nb = ln - 59; ln = int.from_bytes(src[i:i + nb], "little"); i += nb
            ln += 1; out += src[i:i + ln]; i += ln; continue
        if t == 1:
            ln = ((tag >> 2) & 7) + 4; off = ((tag >> 5) << 8) | src[i]; i += 1
        elif t == 2:
            ln = (tag >> 2) + 1; off = int.from_bytes(src[i:i + 2], "little"); i += 2
        else:
            ln = (tag >> 2) + 1; off = int.from_bytes(src[i:i + 4], "little"); i += 4
        for _ in range(ln):
            out.append(out[-off])
    return bytes(out)


def block(b, off, size):
    return snappy(b[off:off + size]) if b[off + size] == 1 else b[off:off + size]


def entries(blk):
    nrest = struct.unpack("<I", blk[-4:])[0]; end = len(blk) - 4 - 4 * nrest; i = 0; key = b""
    while i < end:
        sh, i = varint(blk, i); ns, i = varint(blk, i); vl, i = varint(blk, i)
        key = key[:sh] + blk[i:i + ns]; i += ns
        yield key, blk[i:i + vl]; i += vl


def sstable(path):
    b = path.read_bytes(); ft = b[-48:]
    _, j = varint(ft, 0); _, j = varint(ft, j); io, j = varint(ft, j); isz, _ = varint(ft, j)
    for _, h in entries(block(b, io, isz)):
        o, k = varint(h, 0); s, _ = varint(h, k)
        for key, v in entries(block(b, o, s)):
            tag = struct.unpack("<Q", key[-8:])[0]
            yield key[:-8], tag >> 8, (tag & 0xFF) == 1, v


def write_log(path):
    data = path.read_bytes(); recs = []; cur = b""; i = 0
    while i + 7 <= len(data):
        left = 32768 - i % 32768
        if left < 7:
            i += left; continue
        ln = struct.unpack("<H", data[i + 4:i + 6])[0]; t = data[i + 6]; frag = data[i + 7:i + 7 + ln]; i += 7 + ln
        if t == 0:
            break
        if t == 1: recs.append(frag)
        elif t == 2: cur = frag
        elif t == 3: cur += frag
        elif t == 4: recs.append(cur + frag); cur = b""
    for r in recs:
        seq = struct.unpack("<Q", r[:8])[0]; j = 12
        for n in range(struct.unpack("<I", r[8:12])[0]):
            typ = r[j]; j += 1; kl, j = varint(r, j); k = r[j:j + kl]; j += kl; v = b""
            if typ == 1:
                vl, j = varint(r, j); v = r[j:j + vl]; j += vl
            yield k, seq + n, typ == 1, v


def chrome_state(origin):
    prefix = b"_" + origin.encode() + b"\x00\x01"; best = {}
    sources = [sstable(p) for p in CHROME_LS.glob("*.ldb")] + [write_log(p) for p in CHROME_LS.glob("*.log")]
    for src in sources:
        for k, seq, live, v in src:
            if not k.startswith(prefix):
                continue
            name = k[len(prefix):].decode("latin-1")
            if name in KEYS and (name not in best or seq > best[name][0]):
                # Chrome stores a leading format byte: 0 = UTF-16LE, 1 = Latin-1
                val = (v[1:].decode("utf-16-le") if v[:1] == b"\x00" else v[1:].decode("latin-1")) if live else None
                best[name] = (seq, val)
    return {k: v for k, (_, v) in best.items() if v is not None}


# ---------------------------------------------------------------- build
SEED = """<script>
/* Deployed copy: the deck as saved in the editor's browser (wording, order,
   sections, deleted slides), seeded before anything reads it. */
(() => { const s = %s; for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); })();
</script>"""

STUB = """<script>
/* Deployed copy: no DialKit panel. Every control holds the saved setting. */
window.DialKit = {
  createDialKit(name, cfg) {
    const saved = %s, values = {};
    for (const [k, v] of Object.entries(cfg)) {
      if (v && typeof v === "object" && !Array.isArray(v) && v.type === "action") continue;
      values[k] = k in saved ? saved[k] : Array.isArray(v) ? v[0] : v && typeof v === "object" ? v.default : v;
    }
    values.editText = false; values.gridView = false;
    return { values, subscribe(fn) { fn(values); return () => {}; }, setValue() {}, getValue: (k) => values[k] };
  },
  createDialRoot() {},
};
</script>"""


def build(state, out):
    shutil.copytree(PUBLIC / "prototypes", out / "prototypes", ignore=shutil.ignore_patterns(".DS_Store"))
    shutil.copytree(PUBLIC / "explorations", out / "explorations", ignore=shutil.ignore_patterns(".DS_Store"))
    for f in ["favicon.svg", "favicon.ico", "apple-touch-icon.png"]:
        shutil.copy(PUBLIC / f, out / f)
    deck = out / "prototypes/frank-case-study.html"; h = deck.read_text()
    dial = json.loads(state.get("dialkit:frank-deck-r1", "{}")).get("values", {})
    seed = {k: v for k, v in state.items() if not k.startswith("dialkit:")}
    for tag, new in [('<link rel="stylesheet" href="vendor/dialkit/styles.css">\n', ""),
                     ('<script src="vendor/dialkit/browser.global.js"></script>', STUB % json.dumps(dial)),
                     ("<body>\n", "<body>\n" + SEED % json.dumps(seed) + "\n")]:
        assert tag in h, f"deck markup changed: {tag!r} not found"
        h = h.replace(tag, new, 1)
    deck.write_text(h)
    hide = '<style>[class*="dialkit"]{display:none!important}</style>\n</head>'
    for p in out.rglob("*.html"):
        if p != deck:
            t = p.read_text(errors="ignore")
            if "dialkit" in t.lower():
                p.write_text(t.replace("</head>", hide, 1))
    (out / "vercel.json").write_text(json.dumps({"redirects": [
        {"source": "/", "destination": "/prototypes/frank-case-study.html", "permanent": False}]}))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--origin", default="http://localhost:3101")
    ap.add_argument("--no-chrome", action="store_true", help="deploy the committed deck-state.json as is")
    ap.add_argument("--no-deploy", action="store_true", help="build only; print the folder")
    a = ap.parse_args()
    if not a.no_chrome:
        state = chrome_state(a.origin)
        missing = [k for k in KEYS if k not in state]
        print("read from Chrome:", ", ".join(f"{k} ({len(v)})" for k, v in state.items()), "| missing:", missing or "none")
        STATE.write_text(json.dumps(state, ensure_ascii=False, indent=1) + "\n")
    state = json.loads(STATE.read_text())
    out = pathlib.Path(tempfile.mkdtemp(prefix="frank-deploy-"))
    build(state, out)
    print("built", out)
    if not a.no_deploy:
        subprocess.run(["vercel", "deploy", "--prod", "--yes", "--name", "frank-case-study"], cwd=out, check=True)


if __name__ == "__main__":
    main()
