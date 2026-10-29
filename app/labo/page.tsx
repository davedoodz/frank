import { open, readdir, stat } from "node:fs/promises";
import path from "node:path";

/* The folder is read when the page renders: on the dev server that is every
   request, so a new file appears as soon as it is saved. In production it is
   read at build time, because public/ is not shipped inside the server bundle
   — a new prototype therefore appears on the next deploy. */

const DOSSIER = path.join(process.cwd(), "public", "prototypes");

type Page = {
  file: string;
  title: string;
  modified: number;
  bytes: number;
};

// Only the first 4 kB of each file is read: the title lives in the head, and
// some prototypes are a quarter of a megabyte.
async function entete(full: string): Promise<string> {
  const fh = await open(full, "r");
  try {
    const tampon = Buffer.alloc(4096);
    const { bytesRead } = await fh.read(tampon, 0, 4096, 0);
    return tampon.subarray(0, bytesRead).toString("utf8");
  } finally {
    await fh.close();
  }
}

async function lire(): Promise<Page[]> {
  const entries = await readdir(DOSSIER);
  const pages = await Promise.all(
    entries
      .filter((f) => f.endsWith(".html"))
      .map(async (file) => {
        const full = path.join(DOSSIER, file);
        const [info, head] = await Promise.all([stat(full), entete(full)]);
        const match = head.match(/<title>([\s\S]*?)<\/title>/i);
        return {
          file,
          title: match ? match[1].trim() : file.replace(/\.html$/, ""),
          modified: info.mtimeMs,
          bytes: info.size,
        };
      })
  );
  // Alphabetical, not by date: the build checkout gives every file the same
  // timestamp, so a "most recent" order would be a lie in production.
  return pages.sort((a, b) => a.file.localeCompare(b.file, "fr"));
}

function poids(bytes: number): string {
  return bytes < 1024 ? `${bytes} o` : `${Math.round(bytes / 1024)} ko`;
}

export default async function LaboPage() {
  const pages = await lire();

  return (
    <main className="min-h-screen bg-surface px-6 py-10">
      <div className="mx-auto max-w-[760px]">
        <h1 className="text-title-lg text-ink">labo</h1>
        <p className="mt-2 text-body text-ink-2">
          Chaque fichier HTML de <code className="font-mono">public/prototypes</code>, par ordre
          alphabétique. Un nouveau fichier apparaît ici sans rien ajouter à la main.
        </p>

        <ul className="mt-6 border-t border-line">
          {pages.map((p) => (
            <li key={p.file} className="border-b border-line">
              <a
                href={`/prototypes/${p.file}`}
                className="flex items-baseline gap-3 py-2.5 hover:bg-fill-2"
              >
                <span className="min-w-0 flex-1 truncate text-body text-ink">{p.title}</span>
                <span className="shrink-0 font-mono text-meta text-ink-3">{p.file}</span>
                <span className="shrink-0 text-meta text-ink-3">{poids(p.bytes)}</span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-meta text-ink-3">
          {pages.length} pages · {(pages.reduce((n, p) => n + p.bytes, 0) / 1024).toFixed(0)} ko
        </p>
      </div>
    </main>
  );
}
