import { cropBox, cropBoxMetres } from "@/components/dna/crop";
import type { Floor, Unit } from "@/lib/types";

/**
 * The plan, never tinted or bordered: the sheet image is scaled up and shifted
 * so the unit fills the cell, and the outline rides on top in the same
 * normalised space. The crop is a window on the drawing, not a thumbnail of it.
 */
export default function PlanCrop({
  unit,
  floor,
  aspect = 4 / 3,
  margin,
  outline = true,
  scale = 1,
  widthM,
  invert = false,
  stroke = "#111111",
  strokeWidth = 1,
  fill = "none",
  fillOpacity = 1,
  className = "",
}: {
  unit: Unit;
  floor: Floor;
  aspect?: number;
  margin?: number;
  outline?: boolean;
  /** 1 fits the crop; above 1 the drawing is bigger than the window */
  scale?: number;
  /** when set, the crop is this many metres wide at the sheet's px_per_m */
  widthM?: number;
  /** AutoCAD renders the same sheet as light linework on a dark model space */
  invert?: boolean;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  fillOpacity?: number;
  className?: string;
}) {
  const box =
    widthM === undefined
      ? cropBox(unit, floor, aspect, margin)
      : cropBoxMetres(unit, floor, aspect, widthM);
  const w = box.w / scale;
  const h = box.h / scale;
  const x = box.x + (box.w - w) / 2;
  const y = box.y + (box.h - h) / 2;

  return (
    <div
      className={`relative overflow-hidden ${invert ? "" : "bg-paper"} ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={floor.image_url}
        alt=""
        draggable={false}
        className="absolute select-none"
        style={{
          width: `${100 / w}%`,
          height: `${100 / h}%`,
          maxWidth: "none",
          left: `${(-x * 100) / w}%`,
          top: `${(-y * 100) / h}%`,
          filter: invert ? "invert(1)" : undefined,
        }}
      />
      {outline ? (
        <svg
          viewBox={`${x} ${y} ${w} ${h}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <polygon
            points={unit.outline.map((p) => `${p[0]},${p[1]}`).join(" ")}
            vectorEffect="non-scaling-stroke"
            fill={fill}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      ) : null}
    </div>
  );
}
