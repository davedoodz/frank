import Link from "next/link";
import { projectThumb } from "@/lib/format";
import type { Project } from "@/lib/types";

/**
 * The thumbnail is a placeholder crop of a reference render; a project created
 * in this session has none and keeps the flat block carrying its code.
 *
 * The card is a 20 px container with a 12 px inset, so the 8 px thumbnail and
 * the 9 px state chip inside it both sit concentric with its corner.
 */
export default function ProjectCard({ project }: { project: Project }) {
  const indexed = project.verified_count > 0 || project.last_import_at !== null;
  const thumb = projectThumb(project.project_code);

  return (
    <Link
      href={`/p/${project.project_code}/units`}
      className="group flex flex-col gap-3 rounded-lg border border-line bg-paper p-3 transition-colors duration-[80ms] hover:border-ink"
    >
      <div className="relative flex aspect-[16/10] items-end overflow-hidden rounded-md bg-fill-2 p-2">
        {thumb ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumb}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="font-mono text-meta text-ink-3">
            {project.project_code}
          </span>
        )}
      </div>

      <div className="text-body text-ink">{project.display_name}</div>

      <div className="font-mono text-meta text-ink-2">
        {project.city} · {project.year}
      </div>
      <div className="font-mono text-meta text-ink-3">
        {project.units_count} units · {project.floors_count} floors ·{" "}
        {project.verified_count} verified
      </div>

      <div className="mt-auto flex items-center justify-between pt-1">
        <span
          className={`flex h-[18px] items-center rounded-full px-2 font-mono text-meta ${
            indexed ? "bg-ink text-paper" : "bg-fill-2 text-ink-2"
          }`}
        >
          {indexed ? "indexed" : "connected"}
        </span>
        <span className="font-mono text-meta text-ink-3">
          {project.last_import_at ?? `${project.drawings.length} files`}
        </span>
      </div>
    </Link>
  );
}
