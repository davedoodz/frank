import Link from "next/link";
import PlanCrop from "@/components/dna/PlanCrop";
import { removeFromCollectionAction } from "@/app/p/[code]/office-dna/actions";
import { getFloorById, getProjects } from "@/lib/data";
import type { Collection, CollectionItem, Floor, Project, Unit } from "@/lib/types";

/**
 * The project's design references, listed under the results. One row per saved
 * unit: crop, where it comes from, the note the technician wrote.
 */
export default async function CollectionList({
  code,
  collections,
}: {
  code: string;
  collections: { collection: Collection; items: (CollectionItem & { unit: Unit })[] }[];
}) {
  const projects = await getProjects();

  const sections = await Promise.all(
    collections.map(async ({ collection, items }) => ({
      collection,
      rows: (
        await Promise.all(
          items.map(async (item) => ({
            item,
            floor: await getFloorById(item.unit.floor_id),
            project: projects.find((p) => p.id === item.unit.project_id),
          })),
        )
      ).filter(
        (row): row is { item: CollectionItem & { unit: Unit }; floor: Floor; project: Project } =>
          Boolean(row.floor && row.project),
      ),
    })),
  );

  return (
    <div className="mt-6">
      {sections.map(({ collection, rows }) => (
        <section key={collection.id} className="mt-6">
          <div className="flex items-baseline gap-2 border-b border-line pb-2">
            <span className="label-11">{collection.name}</span>
            <span className="font-mono text-meta text-ink-3">
              {rows.length}
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="py-4 text-body text-ink-3">
              no unit saved yet
            </div>
          ) : (
            <ul>
              {rows.map(({ item, floor, project }) => {
                return (
                  <li
                    key={item.unit_id}
                    className="flex items-center gap-3 border-b border-line py-2"
                  >
                    <Link
                      href={`/p/${code}/office-dna/${item.unit.id}`}
                      className="w-[72px] shrink-0"
                    >
                      <PlanCrop unit={item.unit} floor={floor} aspect={4 / 3} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <Link
                          href={`/p/${code}/office-dna/${item.unit.id}`}
                          className="font-mono text-body text-ink"
                        >
                          {item.unit.number}
                        </Link>
                        <span className="truncate text-body text-ink-2">
                          {project.display_name}
                        </span>
                        <span className="font-mono text-meta text-ink-3">
                          {project.year} · {item.unit.type_qc.value} ·{" "}
                          {item.unit.net_area_m2.value.toFixed(1)} m²
                        </span>
                      </div>
                      {item.note ? (
                        <div className="mt-1 truncate text-body text-ink-2">
                          {item.note}
                        </div>
                      ) : null}
                    </div>
                    <span className="font-mono text-meta text-ink-3">
                      {item.added_at.slice(0, 10)}
                    </span>
                    <form action={removeFromCollectionAction}>
                      <input type="hidden" name="code" value={code} />
                      <input
                        type="hidden"
                        name="collection_id"
                        value={collection.id}
                      />
                      <input
                        type="hidden"
                        name="unit_id"
                        value={item.unit_id}
                      />
                      <button
                        type="submit"
                        className="text-body text-ink-3 transition-colors duration-[80ms] hover:text-ink"
                      >
                        remove
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
