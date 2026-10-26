"use client";

import { useRouter } from "next/navigation";
import { SELECT } from "@/components/ui/Action";
import type { Project, Unit } from "@/lib/types";

/**
 * Two selects that choose the source unit for the office-wide search: a
 * project, then a unit inside it. Each change rewrites `?p=` and `?u=`; the
 * server page re-renders with the new source and its results.
 */
export default function GlobalSourcePicker({
  projects,
  projectCode,
  units,
  unitNumber,
}: {
  projects: Project[];
  projectCode: string;
  units: Unit[];
  unitNumber: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2">
        <span className="label-11">projet</span>
        <select
          value={projectCode}
          onChange={(e) =>
            router.push(`/office-dna?p=${encodeURIComponent(e.target.value)}`)
          }
          className={SELECT}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.project_code}>
              {p.display_name} · {p.year}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span className="label-11">unité</span>
        <select
          value={unitNumber}
          onChange={(e) => {
            const params = new URLSearchParams();
            params.set("p", projectCode);
            params.set("u", e.target.value);
            router.push(`/office-dna?${params.toString()}`);
          }}
          className={SELECT}
        >
          {units.map((u) => (
            <option key={u.id} value={u.number}>
              {u.number} · {u.type_qc.value}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
