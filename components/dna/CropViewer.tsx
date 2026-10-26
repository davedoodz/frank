"use client";

import { useEffect, useRef, useState } from "react";
import { cropBox } from "@/components/dna/crop";
import PlanCrop from "@/components/dna/PlanCrop";
import type { Floor, Unit } from "@/lib/types";

const ASPECT = 16 / 9;
const TICKS = [0, 1, 2, 3, 4, 5];

/**
 * The archived unit at a readable size. Zoom crops tighter on the same sheet;
 * the scale bar below is measured against the crop's real width in metres, so
 * it stays true at every zoom step, not a fixed decoration.
 */
export default function CropViewer({
  unit,
  floor,
  zoom,
  outline,
}: {
  unit: Unit;
  floor: Floor;
  zoom: number;
  outline: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) =>
      setSize({
        w: entries[0].contentRect.width,
        h: entries[0].contentRect.height,
      }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the crop window takes the panel's own shape, so the sheet is never stretched
  const aspect = size.w > 0 && size.h > 0 ? size.w / size.h : ASPECT;
  const box = cropBox(unit, floor, aspect, 0.2);
  const metresWidth = ((box.w / zoom) * floor.width_px) / floor.px_per_m;
  const pxPerMetre = metresWidth > 0 ? size.w / metresWidth : 0;
  const barWidth = pxPerMetre * 5;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-panel p-6">
      <div className="mb-3 shrink-0 text-[12px] text-text-3">
        {floor.sheet_number} · {floor.scale} · Rév. {floor.revision_date}
      </div>

      <div ref={frame} className="relative min-h-0 flex-1">
        <PlanCrop
          unit={unit}
          floor={floor}
          aspect={aspect}
          margin={0.2}
          scale={zoom}
          outline={outline}
          stroke="var(--color-brand)"
          className="h-full w-full"
        />

        {pxPerMetre > 0 ? (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
            <svg width={barWidth} height={22} className="overflow-visible">
              <line
                x1={0}
                y1={6}
                x2={barWidth}
                y2={6}
                stroke="var(--color-text)"
                strokeWidth={1}
              />
              {TICKS.map((t) => (
                <g key={t}>
                  <line
                    x1={t * pxPerMetre}
                    y1={2}
                    x2={t * pxPerMetre}
                    y2={10}
                    stroke="var(--color-text)"
                    strokeWidth={1}
                  />
                  <text
                    x={t * pxPerMetre}
                    y={21}
                    fontSize={10}
                    textAnchor="middle"
                    fill="var(--color-text-2)"
                  >
                    {t === 5 ? "5 m" : t}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : null}

        <div className="pointer-events-none absolute bottom-3 right-3 flex flex-col items-center text-text-2">
          <svg width={18} height={26} viewBox="0 0 18 26">
            <line
              x1={9}
              y1={24}
              x2={9}
              y2={6}
              stroke="currentColor"
              strokeWidth={1.2}
            />
            <polygon points="9,0 5,7 13,7" fill="currentColor" />
          </svg>
          <span className="text-[10px] font-medium">N</span>
        </div>
      </div>
    </div>
  );
}
