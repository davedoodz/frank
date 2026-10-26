"use client";

import { useState } from "react";
import PlanCrop from "@/components/dna/PlanCrop";
import { dimensions } from "@/components/dna/crop";
import { SEGMENT, SEGMENT_OFF, SEGMENT_ON, SEGMENT_SHELL } from "@/components/ui/Action";
import { ORIENTATION_LABEL } from "@/lib/dna";
import { ft2 } from "@/lib/format";
import type { Floor, Project, Room, Unit } from "@/lib/types";

export type Side = {
  unit: Unit;
  floor: Floor;
  project: Project;
  rooms: Room[];
};

/**
 * Two drawings at one real-world scale, from px_per_m. Orientation is kept as
 * drawn; rotation is a deliberate toggle, not a default. The attribute table
 * marks what differs in ink and leaves what matches in ink-2.
 */
export default function CompareView({ left, right }: { left: Side; right: Side }) {
  const [sameScale, setSameScale] = useState(true);
  const [rotateRight, setRotateRight] = useState(false);
  const [showDims, setShowDims] = useState(true);
  const [showAreas, setShowAreas] = useState(true);

  const sizes = { left: dimensions(left.unit, left.floor), right: dimensions(right.unit, right.floor) };
  const aspect = 4 / 3;
  // one field of view, wide enough for the larger of the two units
  const widthM =
    Math.max(
      sizes.left.w,
      sizes.right.w,
      sizes.left.h * aspect,
      sizes.right.h * aspect,
    ) * 1.2;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-line px-6">
        <div className={SEGMENT_SHELL}>
          <button
            type="button"
            onClick={() => setSameScale(true)}
            className={`${SEGMENT} ${sameScale ? SEGMENT_ON : SEGMENT_OFF}`}
          >
            same scale
          </button>
          <button
            type="button"
            onClick={() => setSameScale(false)}
            className={`${SEGMENT} ${sameScale ? SEGMENT_OFF : SEGMENT_ON}`}
          >
            fit each
          </button>
        </div>

        <Toggle on={rotateRight} onClick={() => setRotateRight((v) => !v)}>
          rotate right 90°
        </Toggle>
        <Toggle on={showDims} onClick={() => setShowDims((v) => !v)}>
          overall dimensions
        </Toggle>
        <Toggle on={showAreas} onClick={() => setShowAreas((v) => !v)}>
          area labels
        </Toggle>

        <span className="flex-1" />
        <span className="font-mono text-meta text-ink-3">
          {sameScale ? `${widthM.toFixed(1)} m across both views` : "each view fitted"}
        </span>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-px bg-line">
        {([left, right] as const).map((side, i) => {
          const size = i === 0 ? sizes.left : sizes.right;
          const rotated = i === 1 && rotateRight;
          return (
            <div key={side.unit.id} className="bg-surface p-6">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-title-lg text-ink">
                  {side.unit.number}
                </span>
                <span className="text-body text-ink">{side.unit.type_qc.value}</span>
                <span className="flex-1" />
                <span className="font-mono text-meta text-ink-2">
                  {side.project.display_name} · {side.project.year}
                </span>
              </div>
              <div className="mt-1 font-mono text-meta text-ink-3">
                {side.floor.label} · {side.floor.sheet_number} ·{" "}
                {side.floor.source_file} · {side.floor.scale}
              </div>

              <div className="mt-3 overflow-hidden">
                <div
                  style={
                    rotated
                      ? { transform: "rotate(90deg)", transformOrigin: "center" }
                      : undefined
                  }
                >
                  <PlanCrop
                    unit={side.unit}
                    floor={side.floor}
                    aspect={aspect}
                    widthM={sameScale ? widthM : undefined}
                    margin={0.2}
                  />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-baseline gap-4 font-mono text-meta text-ink-2">
                {showDims ? (
                  <span>
                    {size.w.toFixed(2)} × {size.h.toFixed(2)} m
                  </span>
                ) : null}
                {showAreas ? (
                  <span>
                    net {side.unit.net_area_m2.value.toFixed(1)} m² ·{" "}
                    {ft2(side.unit.net_area_m2.value)} ft²
                  </span>
                ) : null}
                {showAreas ? (
                  <span className="text-ink-3">
                    {side.rooms
                      .filter((r) => r.area_m2 !== null)
                      .map((r) => `${r.name} ${r.area_m2?.toFixed(1)}`)
                      .join(" · ")}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <AttributeTable left={left} right={right} sizes={sizes} />
    </div>
  );
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex h-6 items-center rounded-full border px-3 text-body transition-colors duration-[80ms] ${
        on ? "border-ink text-ink" : "border-line text-ink-3 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

type Sizes = { left: { w: number; h: number }; right: { w: number; h: number } };

function AttributeTable({
  left,
  right,
  sizes,
}: {
  left: Side;
  right: Side;
  sizes: Sizes;
}) {
  const livingOf = (side: Side) =>
    side.rooms.find((r) => r.name.startsWith("salon"))?.area_m2 ?? null;

  const rows: {
    label: string;
    a: string;
    b: string;
    delta?: number;
    unit?: string;
  }[] = [
    {
      label: "net area",
      a: left.unit.net_area_m2.value.toFixed(1),
      b: right.unit.net_area_m2.value.toFixed(1),
      delta: right.unit.net_area_m2.value - left.unit.net_area_m2.value,
      unit: "m²",
    },
    {
      label: "gross area",
      a: left.unit.gross_area_m2.value?.toFixed(1) ?? "—",
      b: right.unit.gross_area_m2.value?.toFixed(1) ?? "—",
      delta:
        left.unit.gross_area_m2.value !== null &&
        right.unit.gross_area_m2.value !== null
          ? right.unit.gross_area_m2.value - left.unit.gross_area_m2.value
          : undefined,
      unit: "m²",
    },
    {
      label: "balcony",
      a: left.unit.has_balcony.value
        ? (left.unit.balcony_area_m2.value?.toFixed(1) ?? "—")
        : "none",
      b: right.unit.has_balcony.value
        ? (right.unit.balcony_area_m2.value?.toFixed(1) ?? "—")
        : "none",
      delta:
        (left.unit.balcony_area_m2.value ?? 0) ||
        (right.unit.balcony_area_m2.value ?? 0)
          ? (right.unit.balcony_area_m2.value ?? 0) -
            (left.unit.balcony_area_m2.value ?? 0)
          : undefined,
      unit: "m²",
    },
    {
      label: "living and kitchen",
      a: livingOf(left)?.toFixed(1) ?? "—",
      b: livingOf(right)?.toFixed(1) ?? "—",
      delta:
        livingOf(left) !== null && livingOf(right) !== null
          ? livingOf(right)! - livingOf(left)!
          : undefined,
      unit: "m²",
    },
    {
      label: "type",
      a: left.unit.type_qc.value,
      b: right.unit.type_qc.value,
    },
    {
      label: "bedrooms",
      a: String(left.unit.bedrooms.value),
      b: String(right.unit.bedrooms.value),
    },
    {
      label: "bathrooms",
      a: String(left.unit.bathrooms.value),
      b: String(right.unit.bathrooms.value),
    },
    {
      label: "rooms on the sheet",
      a: String(left.rooms.length),
      b: String(right.rooms.length),
    },
    {
      label: "position",
      a: left.unit.is_corner.value ? "corner" : "end",
      b: right.unit.is_corner.value ? "corner" : "end",
    },
    {
      label: "orientation",
      a: ORIENTATION_LABEL[left.unit.orientation.value],
      b: ORIENTATION_LABEL[right.unit.orientation.value],
    },
    {
      label: "overall width",
      a: sizes.left.w.toFixed(2),
      b: sizes.right.w.toFixed(2),
      delta: sizes.right.w - sizes.left.w,
      unit: "m",
    },
    {
      label: "overall depth",
      a: sizes.left.h.toFixed(2),
      b: sizes.right.h.toFixed(2),
      delta: sizes.right.h - sizes.left.h,
      unit: "m",
    },
    {
      label: "record",
      a: left.unit.status,
      b: right.unit.status,
    },
  ];

  return (
    <table className="w-full border-t border-line">
      <thead>
        <tr className="border-b border-line">
          <th className="label-11 h-7 px-6 text-left">attribute</th>
          <th className="label-11 h-7 text-right">unit {left.unit.number}</th>
          <th className="label-11 h-7 text-right">unit {right.unit.number}</th>
          <th className="label-11 h-7 px-6 text-right">difference</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const differs = row.a !== row.b;
          return (
            <tr key={row.label} className="border-b border-line hover:bg-paper">
              <td className="h-7 px-6 text-body text-ink-2">{row.label}</td>
              <td
                className={`h-7 text-right font-mono text-meta ${differs ? "text-ink" : "text-ink-2"}`}
              >
                {row.a}
              </td>
              <td
                className={`h-7 text-right font-mono text-meta ${differs ? "text-ink" : "text-ink-2"}`}
              >
                {row.b}
              </td>
              <td className="h-7 px-6 text-right font-mono text-meta">
                {row.delta === undefined ? (
                  <span className="text-ink-3">{differs ? "differs" : "—"}</span>
                ) : (
                  <span className={differs ? "text-ink" : "text-ink-2"}>
                    {row.delta >= 0 ? "+" : "−"}
                    {Math.abs(row.delta).toFixed(1)} {row.unit}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
