"use client";

import { useState } from "react";
import PlanCrop from "@/components/dna/PlanCrop";
import { dimensions } from "@/components/dna/crop";
import { SEGMENT, SEGMENT_OFF, SEGMENT_SHELL } from "@/components/ui/Action";
import type { Floor, Unit } from "@/lib/types";

const STEPS = [1, 1.5, 2, 3, 4];

/**
 * The archived unit at a readable size. Zoom crops tighter on the same sheet,
 * the linework is never scaled by CSS beyond the image's own resolution at
 * 200 dpi, and the plan keeps its square corners on white.
 */
export default function CropViewer({
  unit,
  floor,
  aspect = 3 / 2,
}: {
  unit: Unit;
  floor: Floor;
  aspect?: number;
}) {
  const [step, setStep] = useState(0);
  const size = dimensions(unit, floor);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-10 shrink-0 items-center gap-4 border-b border-line px-4">
        <span className="font-mono text-meta text-ink-2">
          {floor.sheet_number} · {floor.scale} · {floor.revision_date}
        </span>
        <span className="flex-1" />
        <div className={SEGMENT_SHELL}>
          <button
            type="button"
            aria-label="zoom out"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`${SEGMENT} w-7 justify-center px-0 ${SEGMENT_OFF}`}
          >
            −
          </button>
          <span className="w-12 text-center font-mono text-meta text-ink tabular-nums">
            {Math.round(STEPS[step] * 100)}%
          </span>
          <button
            type="button"
            aria-label="zoom in"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className={`${SEGMENT} w-7 justify-center px-0 ${SEGMENT_OFF}`}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setStep(0)}
            className={`${SEGMENT} ${SEGMENT_OFF}`}
          >
            fit
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-surface p-6">
        <PlanCrop
          unit={unit}
          floor={floor}
          aspect={aspect}
          margin={0.2}
          scale={STEPS[step]}
        />
        <div className="mt-2 flex items-baseline gap-4 font-mono text-meta text-ink-3">
          <span>
            {size.w.toFixed(1)} × {size.h.toFixed(1)} m overall
          </span>
          <span>{floor.source_file}</span>
        </div>
      </div>
    </div>
  );
}
