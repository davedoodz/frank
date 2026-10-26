"use client";

import Link from "next/link";
import { useState } from "react";
import Dialog from "@/components/ui/Dialog";

/**
 * The handoff out of fitte. The dialog states what will open and under which
 * rule: the archived sheet is a read-only reference, fitte never writes to a
 * drawing file. The action is a real link to the simulated AutoCAD session.
 */
export default function OpenDrawingDialog({
  code,
  unitId,
  unitNumber,
  projectName,
  sheet,
  filename,
  revision,
  drawingStatus,
}: {
  code: string;
  unitId: string;
  unitNumber: string;
  projectName: string;
  sheet: string;
  filename: string;
  revision: string;
  drawingStatus: string;
}) {
  const [open, setOpen] = useState(false);

  const rows: [string, string][] = [
    ["sheet", sheet],
    ["file", filename],
    ["revision", revision],
    ["index status", drawingStatus],
    ["project", projectName],
    ["write access", "none, read-only reference"],
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-body text-ink transition-colors duration-[80ms] hover:text-accent"
      >
        open original dwg
      </button>

      {open ? (
        <Dialog title="open original drawing" onClose={() => setOpen(false)}>
          <div className="rounded-[14px] border border-line bg-paper p-3">
            <div className="font-mono text-body text-ink">{filename}</div>
            <div className="mt-1 font-mono text-meta text-ink-3">
              unit {unitNumber} · {projectName}
            </div>
          </div>

          <div className="px-3 pt-3">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline justify-between border-b border-line py-1.5 last:border-0"
              >
                <span className="label-11">{label}</span>
                <span className="font-mono text-meta text-ink">{value}</span>
              </div>
            ))}
          </div>

          <p className="px-3 pt-3 text-body text-ink-2">
            The sheet opens in AutoCAD as a reference. fitte does not write to
            drawing files. Copy the geometry you need after reviewing it.
          </p>

          <div className="flex items-center gap-4 px-3 pt-4 pb-2">
            <Link
              href={`/sim/autocad/retrieve?unit=${unitId}&code=${encodeURIComponent(code)}`}
              className="text-body text-ink transition-colors duration-[80ms] hover:text-accent"
            >
              open in autocad, read-only
            </Link>
            <span className="text-ink-3">·</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-body text-ink-2 transition-colors duration-[80ms] hover:text-ink"
            >
              cancel
            </button>
            <span className="flex-1" />
            <span className="font-mono text-meta text-ink-3">simulated</span>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
