import Link from "next/link";
import PlanCrop from "@/components/dna/PlanCrop";
import { Tag } from "@/components/dna/Badge";
import Icon from "@/components/ui/Icon";
import { removeFromCollectionAction } from "@/app/p/[code]/office-dna/actions";
import { getFloorById, getProjects } from "@/lib/data";
import { brLabel } from "@/lib/format";
import type {
  Collection,
  CollectionItem,
  Floor,
  Project,
  Unit,
} from "@/lib/types";

/**
 * The project's reference library, under the gallery. One row per saved unit:
 * the crop, where it comes from, the note and tags the technician wrote, and
 * the way back to the archived record.
 */
export default async function CollectionList({
  code,
  search,
  collections,
}: {
  code: string;
  search: string;
  collections: {
    collection: Collection;
    items: (CollectionItem & { unit: Unit })[];
  }[];
}) {
  if (collections.length === 0) return null;

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
        (
          row,
        ): row is {
          item: CollectionItem & { unit: Unit };
          floor: Floor;
          project: Project;
        } => Boolean(row.floor && row.project),
      ),
    })),
  );

  return (
    <section className="mt-8">
      <h2 className="text-[15px] font-semibold text-text">
        Bibliothèque de références du projet
      </h2>

      {sections.map(({ collection, rows }) => (
        <div key={collection.id} className="panel mt-3 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-edge-2 px-4 py-3">
            <Icon name="bookmark" size={14} className="text-text-2" />
            <span className="text-[13px] font-medium text-text">
              {collection.name}
            </span>
            <span className="text-[12px] text-text-3">{rows.length}</span>
          </div>

          {rows.length === 0 ? (
            <div className="px-4 py-6 text-[13px] text-text-3">
              Aucune unité enregistrée pour l’instant.
            </div>
          ) : (
            rows.map(({ item, floor, project }) => (
              <div
                key={item.unit_id}
                className="flex items-center gap-4 border-b border-edge-2 px-4 py-3 last:border-0"
              >
                <Link
                  href={`/p/${code}/office-dna/${item.unit.id}?${search}`}
                  className="w-[72px] shrink-0 overflow-hidden rounded-md border border-edge"
                >
                  <PlanCrop unit={item.unit} floor={floor} aspect={4 / 3} />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <Link
                      href={`/p/${code}/office-dna/${item.unit.id}?${search}`}
                      className="text-[14px] font-semibold text-text transition-colors hover:text-text-2"
                    >
                      {item.unit.number}
                    </Link>
                    <span className="truncate text-[13px] text-text-2">
                      {project.display_name}
                    </span>
                    <span className="text-[12px] text-text-3">
                      {project.year} · {brLabel(item.unit.type_qc.value)} ·{" "}
                      {item.unit.net_area_m2.value.toFixed(1)} m²
                    </span>
                  </div>
                  {item.note ? (
                    <div className="mt-1 truncate text-[13px] text-text-2">
                      {item.note}
                    </div>
                  ) : null}
                  {item.tags.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  ) : null}
                </div>

                <span className="shrink-0 text-[12px] text-text-3">
                  {item.added_at.slice(0, 10)}
                </span>

                <form action={removeFromCollectionAction}>
                  <input type="hidden" name="code" value={code} />
                  <input
                    type="hidden"
                    name="collection_id"
                    value={collection.id}
                  />
                  <input type="hidden" name="unit_id" value={item.unit_id} />
                  <button
                    type="submit"
                    aria-label={`retirer l’unité ${item.unit.number}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-text-3 transition-colors hover:bg-app hover:text-text"
                  >
                    <Icon name="close" size={15} />
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      ))}
    </section>
  );
}
