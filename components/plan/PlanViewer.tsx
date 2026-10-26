"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { brLabel, typologyColor } from "@/lib/format";
import type { Floor, Unit } from "@/lib/types";

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const FIT_MARGIN = 24;

type View = { zoom: number; x: number; y: number };

/**
 * The drawing. The sheet image is laid out at fit size and never filtered or
 * tinted; outlines ride on top in normalised coordinates. Selection is a blue
 * outline with a light blue wash, typology is a 14 percent fill.
 */
export default function PlanViewer({
  floor,
  units,
  selected,
  onSelect,
  typologyFills,
  showLabels = false,
  toolbar,
}: {
  floor: Floor;
  units: Unit[];
  selected: Unit | null;
  onSelect: (number: string | null) => void;
  typologyFills: boolean;
  showLabels?: boolean;
  toolbar?: React.ReactNode;
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

  const fit = Math.min(
    (size.w - FIT_MARGIN * 2) / floor.width_px,
    (size.h - FIT_MARGIN * 2) / floor.height_px,
  );
  const baseW = floor.width_px * Math.max(fit, 0);
  const baseH = floor.height_px * Math.max(fit, 0);

  const reset = useCallback(() => {
    setView({ zoom: 1, x: (size.w - baseW) / 2, y: (size.h - baseH) / 2 });
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

  function strokeOf(unit: Unit) {
    if (selected?.id === unit.id) return "var(--color-brand)";
    if (hover === unit.id) return "var(--color-brand)";
    if (typologyFills) return typologyColor(unit.type_qc.value);
    return "var(--color-edge)";
  }

  function fillOf(unit: Unit) {
    if (selected?.id === unit.id) return "var(--color-brand)";
    if (typologyFills) return typologyColor(unit.type_qc.value);
    return "transparent";
  }

  function fillOpacityOf(unit: Unit) {
    if (selected?.id === unit.id) return 0.14;
    if (hover === unit.id) return typologyFills ? 0.22 : 0.08;
    return typologyFills ? 0.14 : 0;
  }

  return (
    <section className="panel flex min-h-0 flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-edge-2 px-4">
        {toolbar}
        <span className="flex-1" />

        <div className="flex h-9 items-center rounded-lg border border-edge">
          <button
            type="button"
            onClick={() => zoomBy(1 / 1.25)}
            aria-label="zoom out"
            className="flex h-full w-9 items-center justify-center text-text-2 transition-colors hover:text-text"
          >
            <Icon name="minus" size={14} />
          </button>
          <span className="w-14 border-x border-edge text-center text-[13px] font-medium text-text tabular-nums">
            {Math.round(view.zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => zoomBy(1.25)}
            aria-label="zoom in"
            className="flex h-full w-9 items-center justify-center text-text-2 transition-colors hover:text-text"
          >
            <Icon name="plus" size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={reset}
          aria-label="fit to view"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge text-text-2 transition-colors hover:text-text"
        >
          <Icon name="expand" size={14} />
        </button>
      </div>

      <div
        ref={frame}
        className="relative min-h-0 flex-1 overflow-hidden rounded-b-[11px] bg-panel"
        onPointerDown={(e) => {
          drag.current = {
            x: e.clientX - view.x,
            y: e.clientY - view.y,
            moved: false,
          };
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
          className="absolute top-0 left-0 origin-top-left"
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
            className="block select-none bg-white"
          />
          <svg
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            className="absolute top-0 left-0"
            width={baseW}
            height={baseH}
          >
            {units.map((unit) => (
              <polygon
                key={unit.id}
                points={unit.outline.map((p) => `${p[0]},${p[1]}`).join(" ")}
                vectorEffect="non-scaling-stroke"
                stroke={strokeOf(unit)}
                strokeWidth={selected?.id === unit.id ? 2 : 1}
                fill={fillOf(unit)}
                fillOpacity={fillOpacityOf(unit)}
                style={{
                  transition: "fill-opacity 90ms linear",
                  cursor: "pointer",
                }}
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

        {/* Chips sit outside the transform so they stay legible at any zoom.
            The sheet already prints each unit's number, so a chip is pinned to
            the outline's top-left corner instead of over the printed label. */}
        <div className="pointer-events-none absolute inset-0">
          {units
            .filter((u) => showLabels || u.id === selected?.id)
            .map((unit) => {
              const x0 = Math.min(...unit.outline.map((p) => p[0]));
              const y0 = Math.min(...unit.outline.map((p) => p[1]));
              const lx = view.x + view.zoom * x0 * baseW + 6;
              const ly = view.y + view.zoom * y0 * baseH + 6;
              if (lx < -60 || ly < -24 || lx > size.w || ly > size.h) return null;
              const on = unit.id === selected?.id;
              return (
                <span
                  key={unit.id}
                  style={{ left: lx, top: ly }}
                  className={`absolute flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                    on
                      ? "bg-brand text-white"
                      : "bg-white/90 text-text ring-1 ring-edge"
                  }`}
                >
                  {on ? null : (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: typologyColor(unit.type_qc.value) }}
                    />
                  )}
                  {unit.number} · {brLabel(unit.type_qc.value)}
                </span>
              );
            })}
        </div>

        <div className="pointer-events-none absolute bottom-3 left-4 text-[11px] text-text-3">
          {floor.source_file} · {floor.scale} · {floor.revision_date}
        </div>
      </div>
    </section>
  );
}
