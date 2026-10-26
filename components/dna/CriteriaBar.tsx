"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon, { type IconName } from "@/components/ui/Icon";
import { BTN_QUIET } from "@/components/ui/Button";
import {
  ORIENTATION_LABEL,
  criteriaQuery,
  type Criteria,
} from "@/lib/dna";
import type { Orientation } from "@/lib/types";

const ORIENTATIONS: Orientation[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/** The slack around the source unit's area, as the search offers it. */
const SPREADS = [0.05, 0.1, 0.15, 0.25];

/** The control inside a criterion field: the icon sits in its left padding. */
const CRITERION =
  "select-pill h-10 w-full bg-transparent pr-8 pl-11 text-[13px] font-medium text-text";

function band(area: number, pct: number): [number, number] {
  return [
    Math.floor((area * (1 - pct)) / 5) * 5,
    Math.ceil((area * (1 + pct)) / 5) * 5,
  ];
}

/**
 * The search criteria, prefilled from the unit open in AutoCAD and editable
 * here. Every change rewrites the URL, so the gallery, the archived unit page
 * and the handoff back to the drawing all carry the same search.
 */
export default function CriteriaBar({
  code,
  sourceNumber,
  sourceArea,
  criteria,
  defaults,
  extra,
  sources,
}: {
  code: string;
  sourceNumber: string;
  sourceArea: number;
  criteria: Criteria;
  defaults: Criteria;
  extra: Record<string, string | undefined>;
  sources: { number: string; summary: string }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  function push(next: Criteria, unit = sourceNumber) {
    router.replace(
      `/p/${code}/office-dna?${criteriaQuery(unit, next, extra)}`,
      { scroll: false },
    );
  }

  const bands = SPREADS.map((p) => band(sourceArea, p));
  const current: [number, number] = [criteria.areaMin, criteria.areaMax];
  const known = bands.some(
    ([lo, hi]) => lo === current[0] && hi === current[1],
  );
  const areaValue =
    criteria.areaMin === 0 && criteria.areaMax >= 999
      ? "any"
      : known
        ? `${criteria.areaMin}:${criteria.areaMax}`
        : "custom";

  const edited =
    criteria.bedrooms !== defaults.bedrooms ||
    criteria.areaMin !== defaults.areaMin ||
    criteria.areaMax !== defaults.areaMax ||
    criteria.corner !== defaults.corner ||
    criteria.orientation !== defaults.orientation;

  return (
    <div className="panel mt-5 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-[11px] tracking-[0.02em] text-text-3">
          Critères de recherche (à partir de l’unité {sourceNumber})
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="flex h-6 items-center gap-1.5 text-[13px] font-medium text-text transition-colors hover:text-text-2"
        >
          <Icon name={editing ? "chevron-down" : "edit"} size={14} />
          {editing ? "Terminé" : "Modifier les critères"}
        </button>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Field icon="bed" label="chambres">
          <select
            value={criteria.bedrooms === null ? "any" : String(criteria.bedrooms)}
            aria-label="chambres"
            onChange={(e) =>
              push({
                ...criteria,
                bedrooms:
                  e.target.value === "any" ? null : Number(e.target.value),
              })
            }
            className={CRITERION}
          >
            <option value="any">N’importe quel nombre de chambres</option>
            <option value="0">Studio</option>
            <option value="1">1 chambre</option>
            <option value="2">2 chambres</option>
            <option value="3">3 chambres</option>
            <option value="4">4 chambres</option>
          </select>
        </Field>

        <Field icon="ruler" label="superficie">
          <select
            value={areaValue}
            aria-label="superficie de l’étage"
            onChange={(e) => {
              const v = e.target.value;
              if (v === "any") push({ ...criteria, areaMin: 0, areaMax: 999 });
              else if (v !== "custom") {
                const [lo, hi] = v.split(":").map(Number);
                push({ ...criteria, areaMin: lo, areaMax: hi });
              }
            }}
            className={CRITERION}
          >
            {bands.map(([lo, hi]) => (
              <option key={`${lo}:${hi}`} value={`${lo}:${hi}`}>
                {lo} – {hi} m²
              </option>
            ))}
            {areaValue === "custom" ? (
              <option value="custom">
                {criteria.areaMin} – {criteria.areaMax} m²
              </option>
            ) : null}
            <option value="any">N’importe quelle superficie</option>
          </select>
        </Field>

        <Field icon="layers" label="position">
          <select
            value={
              criteria.corner === null ? "any" : criteria.corner ? "yes" : "no"
            }
            aria-label="position"
            onChange={(e) =>
              push({
                ...criteria,
                corner:
                  e.target.value === "any" ? null : e.target.value === "yes",
              })
            }
            className={CRITERION}
          >
            <option value="any">N’importe quelle position</option>
            <option value="yes">Unité de coin</option>
            <option value="no">Unité d’extrémité</option>
          </select>
        </Field>

        <Field icon="sun" label="orientation">
          <select
            value={criteria.orientation ?? "any"}
            aria-label="orientation"
            onChange={(e) =>
              push({
                ...criteria,
                orientation:
                  e.target.value === "any"
                    ? null
                    : (e.target.value as Orientation),
              })
            }
            className={CRITERION}
          >
            <option value="any">N’importe quelle orientation</option>
            {ORIENTATIONS.map((o) => (
              <option key={o} value={o}>
                {ORIENTATION_LABEL[o]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {editing ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-edge-2 pt-3">
          <label className="flex items-center gap-2 text-[12px] text-text-2">
            Critères à partir de
            <select
              value={sourceNumber}
              aria-label="unité source"
              onChange={(e) => push(criteria, e.target.value)}
              className="select-pill h-9 rounded-lg border border-edge bg-panel pr-7 pl-3 text-[13px] text-text"
            >
              {sources.map((s) => (
                <option key={s.number} value={s.number}>
                  Unité {s.number} · {s.summary}
                </option>
              ))}
            </select>
          </label>

          <form
            className="flex items-center gap-2 text-[12px] text-text-2"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const min = Number(form.get("amin"));
              const max = Number(form.get("amax"));
              push({
                ...criteria,
                areaMin: Number.isFinite(min) && min >= 0 ? min : criteria.areaMin,
                areaMax:
                  Number.isFinite(max) && max > min ? max : criteria.areaMax,
              });
            }}
          >
            Plage exacte
            <input
              name="amin"
              defaultValue={criteria.areaMin}
              aria-label="superficie minimale"
              className="h-9 w-16 rounded-lg border border-edge bg-panel px-2 text-center text-[13px] text-text"
            />
            <span className="text-text-3">–</span>
            <input
              name="amax"
              defaultValue={criteria.areaMax}
              aria-label="superficie maximale"
              className="h-9 w-16 rounded-lg border border-edge bg-panel px-2 text-center text-[13px] text-text"
            />
            m²
            <button type="submit" className={BTN_QUIET}>
              Appliquer
            </button>
          </form>

          <span className="flex-1" />

          {edited ? (
            <button
              type="button"
              onClick={() => push(defaults)}
              className={BTN_QUIET}
            >
              Rétablir l’unité {sourceNumber}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** One criterion: icon, value, chevron, all inside a 40 px control. */
function Field({
  icon,
  label,
  children,
}: {
  icon: IconName;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-10 items-center rounded-lg border border-edge bg-panel">
      <span className="pointer-events-none absolute left-3 flex h-6 w-6 items-center justify-center rounded-md bg-app text-text-2">
        <Icon name={icon} size={13} />
      </span>
      <div className="w-full" data-criterion={label}>
        {children}
      </div>
    </div>
  );
}
