import Link from "next/link";
import { notFound } from "next/navigation";
import PlanCrop from "@/components/dna/PlanCrop";
import { dimensions } from "@/components/dna/crop";
import { getFloorById, getProjects, getRooms, getUnit } from "@/lib/data";

/**
 * Simulated AutoCAD, PRD section 12 "07 retrieve": the archived sheet open in
 * the host, the historical unit selected, the fitte palette docked on the
 * right. Nothing here is connected to an installed application, and the
 * drawing is never written to.
 */
export default async function RetrievePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const asked = Array.isArray(query.unit) ? query.unit[0] : query.unit;
  const code = Array.isArray(query.code) ? query.code[0] : query.code;

  const unit = asked ? await getUnit(asked) : null;
  const floor = unit ? await getFloorById(unit.floor_id) : null;
  if (!unit || !floor) notFound();

  const project = (await getProjects()).find((p) => p.id === unit.project_id);
  if (!project) notFound();

  const rooms = await getRooms(unit.id);
  const size = dimensions(unit, floor);

  const rows: [string, string][] = [
    ["unit", unit.number],
    ["type", unit.type_qc.value],
    ["net area", `${unit.net_area_m2.value.toFixed(1)} m²`],
    ["overall", `${size.w.toFixed(2)} × ${size.h.toFixed(2)} m`],
    ["rooms", String(rooms.length)],
    ["sheet", floor.sheet_number],
    ["revision", floor.revision_date],
    ["project", `${project.display_name} · ${project.year}`],
  ];

  return (
    <div className="flex h-screen flex-col bg-[#212830] text-[#E6E6E6]">
      {/* ribbon */}
      <div className="shrink-0 border-b border-[#11161C] bg-[#2B2F36]">
        <div className="flex h-8 items-center gap-4 px-3 text-[12px] text-[#C9CDD2]">
          <span>{floor.source_file}</span>
          <span className="text-[#7D848C]">— AutoCAD 2024</span>
        </div>
        <div className="flex h-8 items-center gap-5 border-t border-[#11161C] px-3 text-[12px] text-[#9BA2AA]">
          {["Home", "Insert", "Annotate", "View", "Manage", "Add-ins", "fitte"].map(
            (tab) => (
              <span
                key={tab}
                className={tab === "fitte" ? "text-[#E6E6E6]" : undefined}
              >
                {tab}
              </span>
            ),
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* model space */}
        <div className="relative min-w-0 flex-1 p-8">
          <PlanCrop
            unit={unit}
            floor={floor}
            aspect={16 / 10}
            margin={0.25}
            invert
            stroke="#3C8CFF"
            strokeWidth={1}
            fill="#3C8CFF"
            fillOpacity={0.25}
          />
          <div className="pointer-events-none absolute bottom-2 left-3 font-mono text-[11px] text-[#7D848C]">
            simulated
          </div>
        </div>

        {/* fitte palette */}
        <aside className="flex w-[320px] shrink-0 flex-col border-l border-[#11161C] bg-[#2B2F36]">
          <div className="flex h-7 items-center justify-between border-b border-[#11161C] px-2 text-[12px] text-[#C9CDD2]">
            <span>fitte</span>
            <span className="text-[#7D848C]">▭ ×</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-surface p-4 text-ink">
            <div className="label-11">selected historical unit</div>
            <div className="mt-1 font-mono text-title-lg text-ink">
              {unit.number}
            </div>
            <div className="mt-1 font-mono text-meta text-ink-3">
              {project.display_name} · {floor.label} · read-only reference
            </div>

            <div className="mt-4">
              {rows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-1.5 last:border-0"
                >
                  <span className="text-body text-ink-2">{label}</span>
                  <span className="truncate font-mono text-meta text-ink">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-line pt-3">
              <div className="label-11">copy unit geometry</div>
              <p className="mt-2 text-body text-ink-2">
                The selected entities come from an archived sheet at{" "}
                {floor.scale}. Review layers, blocks and dimension styles before
                copying them into the current drawing. fitte does not write to
                this file.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3">
              {code ? (
                <Link
                  href={`/p/${code}/office-dna/${unit.id}`}
                  className="text-body text-ink transition-colors duration-[80ms] hover:text-accent"
                >
                  open full unit dna in fitte
                </Link>
              ) : null}
              <Link
                href={code ? `/p/${code}/office-dna` : "/"}
                className="text-body text-ink-2 transition-colors duration-[80ms] hover:text-ink"
              >
                back to fitte
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* command line and status bar */}
      <div className="shrink-0 border-t border-[#11161C] bg-[#1A1F26] px-3 py-1 font-mono text-[11px] text-[#9BA2AA]">
        <div>Command: _FITTERETRIEVE</div>
        <div className="text-[#7D848C]">
          Select objects: 1 found · unit {unit.number} · read-only reference
        </div>
      </div>
      <div className="flex h-6 shrink-0 items-center gap-4 border-t border-[#11161C] bg-[#2B2F36] px-3 font-mono text-[11px] text-[#7D848C]">
        <span>MODEL</span>
        <span>{floor.scale}</span>
        <span>SNAP</span>
        <span>GRID</span>
        <span>OSNAP</span>
        <span className="flex-1" />
        <span>simulated</span>
      </div>
    </div>
  );
}
