"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  SEGMENT,
  SEGMENT_OFF,
  SEGMENT_SHELL,
} from "@/components/ui/Action";
import { typologyColor } from "@/lib/format";
import type { Floor, Unit } from "@/lib/types";

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const FIT_MARGIN = 24;

type View = { zoom: number; x: number; y: number };

export default function PlanViewer({
  floor,
  units,
  selected,
  onSelect,
  typologyFills,
}: {
  floor: Floor;
  units: Unit[];
  selected: Unit | null;
  onSelect: (number: string | null) => void;
  typologyFills: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 });
  const [hover, setHover] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    observer.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => observer.disconnect();
  }, []);

  // the plan at fit: the image is laid out at this size, never transformed itself
  const fit = Math.min(
    (size.w - FIT_MARGIN * 2) / floor.width_px,
    (size.h - FIT_MARGIN * 2) / floor.height_px,
  );
  const baseW = floor.width_px * Math.max(fit, 0);
  const baseH = floor.height_px * Math.max(fit, 0);

  const reset = useCallback(() => {
    setView({
      zoom: 1,
      x: (size.w - baseW) / 2,
      y: (size.h - baseH) / 2,
    });
  }, [size.w, size.h, baseW, baseH]);

  useEffect(() => {
    if (size.w > 0 && baseW > 0) reset();
  }, [reset, size.w, baseW, floor.id]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const rect = el!.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      setView((v) => {
        const next = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, v.zoom * Math.exp(-event.deltaY * 0.002)),
        );
        const k = next / v.zoom;
        return { zoom: next, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
      });
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function strokeOf(unit: Unit) {
    if (selected?.id === unit.id) return "var(--color-accent)";
    if (hover === unit.id) return "var(--color-ink)";
    return unit.status === "verified" ? "var(--color-ink)" : "var(--color-line)";
  }

  function fillOf(unit: Unit) {
    if (selected?.id === unit.id) return "var(--color-accent-08)";
    if (typologyFills) return typologyColor(unit.type_qc.value);
    return "none";
  }

  const zoomBy = useCallback(
    (k: number) => {
      const px = size.w / 2;
      const py = size.h / 2;
      setView((v) => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * k));
        const r = next / v.zoom;
        return { zoom: next, x: px - (px - v.x) * r, y: py - (py - v.y) * r };
      });
    },
    [size.w, size.h],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-4 border-b border-line px-4">
        <div className="min-w-0">
          <div className="text-title text-ink">{floor.label}</div>
          <div className="font-mono text-meta text-ink-3">
            {floor.sheet_number} · {units.length} units · {floor.scale}
          </div>
        </div>

        <div className="flex-1" />

        <div className={SEGMENT_SHELL}>
          <button
            type="button"
            onClick={() => zoomBy(1 / 1.25)}
            aria-label="zoom out"
            className={`${SEGMENT} w-7 justify-center px-0 ${SEGMENT_OFF}`}
          >
            −
          </button>
          <span className="w-12 text-center font-mono text-meta text-ink tabular-nums">
            {Math.round(view.zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => zoomBy(1.25)}
            aria-label="zoom in"
            className={`${SEGMENT} w-7 justify-center px-0 ${SEGMENT_OFF}`}
          >
            +
          </button>
          <button
            type="button"
            onClick={reset}
            className={`${SEGMENT} ${SEGMENT_OFF}`}
          >
            fit
          </button>
        </div>
      </div>

      <div
        ref={frame}
        className="relative min-h-0 flex-1 overflow-hidden bg-surface"
      onPointerDown={(e) => {
        drag.current = { x: e.clientX - view.x, y: e.clientY - view.y, moved: false };
        (e.target as Element).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        d.moved = true;
        setView((v) => ({ ...v, x: e.clientX - d.x, y: e.clientY - d.y }));
      }}
      onPointerUp={() => {
        const moved = drag.current?.moved ?? false;
        drag.current = null;
        if (!moved) onSelect(null);
      }}
      onDoubleClick={reset}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: baseW,
          height: baseH,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={floor.image_url}
          alt=""
          width={baseW}
          height={baseH}
          draggable={false}
          className="block select-none bg-paper"
        />
        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          className="absolute left-0 top-0"
          width={baseW}
          height={baseH}
        >
          {units.map((unit) => (
            <polygon
              key={unit.id}
              points={unit.outline.map((p) => `${p[0]},${p[1]}`).join(" ")}
              vectorEffect="non-scaling-stroke"
              stroke={strokeOf(unit)}
              strokeWidth={selected?.id === unit.id ? 1.5 : 1}
              fill={fillOf(unit)}
              fillOpacity={
                selected?.id === unit.id ? 1 : typologyFills ? 0.12 : 0
              }
              style={{ transition: "fill-opacity 80ms linear", cursor: "pointer" }}
              onPointerEnter={() => setHover(unit.id)}
              onPointerLeave={() => setHover((h) => (h === unit.id ? null : h))}
              onPointerUp={(e) => {
                if (drag.current?.moved) return;
                e.stopPropagation();
                drag.current = null;
                onSelect(unit.number);
              }}
            />
          ))}
        </svg>
      </div>

      {/* the drawing carries every number, so the overlay marks only the
          selected unit; it sits outside the transform to stay 11 px at any zoom */}
      <div className="pointer-events-none absolute inset-0">
        {units.filter((u) => u.id === selected?.id).map((unit) => {
          const lx = view.x + view.zoom * unit.label_pos[0] * baseW;
          const ly = view.y + view.zoom * unit.label_pos[1] * baseH;
          if (lx < -40 || ly < -20 || lx > size.w + 40 || ly > size.h + 20) {
            return null;
          }
          return (
            <span
              key={unit.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-1.5 py-px font-mono text-meta ${
                selected?.id === unit.id
                  ? "bg-ink text-paper"
                  : "bg-paper text-ink-2"
              }`}
              style={{ left: lx, top: ly }}
            >
              {unit.number}
            </span>
          );
        })}
      </div>

        <div className="pointer-events-none absolute bottom-2 left-2 font-mono text-meta text-ink-3">
          {floor.source_file} · {floor.revision_date}
        </div>
      </div>
    </div>
  );
}
