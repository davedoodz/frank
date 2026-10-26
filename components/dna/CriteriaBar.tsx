"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FIELD } from "@/components/ui/Action";
import { ORIENTATION_LABEL, criteriaQuery, type Criteria } from "@/lib/dna";
import type { Orientation } from "@/lib/types";

const ORIENTATIONS: Orientation[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

type Field = "bed" | "area" | "corner" | "orient";

/**
 * Four chips carry the search. The value is the chip text; clicking it opens
 * the control in place, and every change rewrites the URL so the page, the
 * links out of it and the browser history all hold the same search.
 */
export default function CriteriaBar({
  code,
  sourceNumber,
  criteria,
  defaults,
  extra,
}: {
  code: string;
  sourceNumber: string;
  criteria: Criteria;
  defaults: Criteria;
  extra: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<Field | null>(null);

  function push(next: Criteria) {
    router.replace(
      `/p/${code}/office-dna?${criteriaQuery(sourceNumber, next, extra)}`,
      { scroll: false },
    );
  }

  const edited =
    criteria.bedrooms !== defaults.bedrooms ||
    criteria.areaMin !== defaults.areaMin ||
    criteria.areaMax !== defaults.areaMax ||
    criteria.corner !== defaults.corner ||
    criteria.orientation !== defaults.orientation;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-meta text-ink-3">
        from unit {sourceNumber}
      </span>

      <Chip
        open={open === "bed"}
        onOpen={() => setOpen(open === "bed" ? null : "bed")}
        label={
          criteria.bedrooms === null
            ? "any bedrooms"
            : criteria.bedrooms === 0
              ? "studio"
              : `${criteria.bedrooms} bedrooms`
        }
      >
        <Select
          value={criteria.bedrooms === null ? "any" : String(criteria.bedrooms)}
          options={[
            ["any", "any bedrooms"],
            ["0", "studio"],
            ["1", "1 bedroom"],
            ["2", "2 bedrooms"],
            ["3", "3 bedrooms"],
            ["4", "4 bedrooms"],
          ]}
          onChange={(v) => {
            setOpen(null);
            push({ ...criteria, bedrooms: v === "any" ? null : Number(v) });
          }}
        />
      </Chip>

      <Chip
        open={open === "area"}
        onOpen={() => setOpen(open === "area" ? null : "area")}
        label={`${criteria.areaMin}–${criteria.areaMax} m²`}
      >
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const min = Number(form.get("amin"));
            const max = Number(form.get("amax"));
            setOpen(null);
            push({
              ...criteria,
              areaMin: Number.isFinite(min) && min > 0 ? min : criteria.areaMin,
              areaMax: Number.isFinite(max) && max > min ? max : criteria.areaMax,
            });
          }}
        >
          <input
            name="amin"
            defaultValue={criteria.areaMin}
            aria-label="minimum area"
            className={`w-14 text-center font-mono ${FIELD}`}
          />
          <span className="text-ink-3">–</span>
          <input
            name="amax"
            defaultValue={criteria.areaMax}
            aria-label="maximum area"
            className={`w-14 text-center font-mono ${FIELD}`}
          />
          <button type="submit" className="px-1 text-body text-ink">
            set
          </button>
        </form>
      </Chip>

      <Chip
        open={open === "corner"}
        onOpen={() => setOpen(open === "corner" ? null : "corner")}
        label={
          criteria.corner === null
            ? "any position"
            : criteria.corner
              ? "corner unit"
              : "end unit"
        }
      >
        <Select
          value={
            criteria.corner === null ? "any" : criteria.corner ? "yes" : "no"
          }
          options={[
            ["any", "any position"],
            ["yes", "corner unit"],
            ["no", "end unit"],
          ]}
          onChange={(v) => {
            setOpen(null);
            push({ ...criteria, corner: v === "any" ? null : v === "yes" });
          }}
        />
      </Chip>

      <Chip
        open={open === "orient"}
        onOpen={() => setOpen(open === "orient" ? null : "orient")}
        label={
          criteria.orientation === null
            ? "any orientation"
            : ORIENTATION_LABEL[criteria.orientation]
        }
      >
        <Select
          value={criteria.orientation ?? "any"}
          options={[
            ["any", "any orientation"],
            ...ORIENTATIONS.map(
              (o) => [o, ORIENTATION_LABEL[o]] as [string, string],
            ),
          ]}
          onChange={(v) => {
            setOpen(null);
            push({
              ...criteria,
              orientation: v === "any" ? null : (v as Orientation),
            });
          }}
        />
      </Chip>

      {edited ? (
        <button
          type="button"
          onClick={() => {
            setOpen(null);
            push(defaults);
          }}
          className="text-body text-ink-2 transition-colors duration-[80ms] hover:text-ink"
        >
          reset criteria
        </button>
      ) : null}
    </div>
  );
}

/** Closed: the value. Open: the control, at the same height, in the same row. */
function Chip({
  label,
  open,
  onOpen,
  children,
}: {
  label: string;
  open: boolean;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  if (open) return <>{children}</>;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-6 items-center rounded-full border border-line px-3 text-body text-ink transition-colors duration-[80ms] hover:border-ink"
    >
      {label}
    </button>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <select
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="select-pill h-6 rounded-full border border-ink bg-transparent pr-6 pl-3 text-body text-ink"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}
