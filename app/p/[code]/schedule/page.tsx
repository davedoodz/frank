import { notFound } from "next/navigation";
import ScheduleTable from "@/components/schedule/ScheduleTable";
import { getFloors, getProject, getUnits } from "@/lib/data";
import { getPrefs } from "@/lib/prefs.server";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await getProject(decodeURIComponent(code));
  if (!project) notFound();

  const floors = await getFloors(project.id);
  const units = await getUnits(project.id);
  const prefs = await getPrefs();
  const rows = units.map((u) => {
    const floor = floors.find((f) => f.id === u.floor_id);
    return {
      id: u.id,
      number: u.number,
      level: floor?.level ?? 0,
      floor_label: floor?.label ?? "—",
      sheet: floor?.sheet_number ?? "—",
      revision: floor?.revision_date ?? "—",
      status: u.status,
      type: u.type_qc.value,
      type_c: u.type_qc.confidence,
      bedrooms: u.bedrooms.value,
      bedrooms_c: u.bedrooms.confidence,
      bathrooms: u.bathrooms.value,
      bathrooms_c: u.bathrooms.confidence,
      rooms: u.rooms_count.value,
      rooms_c: u.rooms_count.confidence,
      net: u.net_area_m2.value,
      net_c: u.net_area_m2.confidence,
      gross: u.gross_area_m2.value,
      gross_c: u.gross_area_m2.confidence,
      orientation: u.orientation.value,
      orientation_c: u.orientation.confidence,
      corner: u.is_corner.value,
      corner_c: u.is_corner.confidence,
      balcony: u.has_balcony.value,
      balcony_c: u.has_balcony.confidence,
      balcony_area: u.balcony_area_m2.value,
      balcony_area_c: u.balcony_area_m2.confidence,
    };
  });

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-meta text-ink-2">
        aucune unité indexée
      </div>
    );
  }

  return <ScheduleTable code={project.project_code} rows={rows} prefs={prefs} />;
}
