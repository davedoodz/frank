import Link from "next/link";
import type { Project } from "@/lib/types";

/**
 * No renders, no photography. The thumbnail is a flat fill-2 block carrying the
 * project code, so a card never waits on an asset that does not exist yet.
 */
export default function ProjectCard({ project }: { project: Project }) {
  const indexed = project.verified_count > 0 || project.last_import_at !== null;

  return (
    <Link
      href={`/p/${project.project_code}/units`}
      className="group flex flex-col gap-3 border border-line bg-paper p-3 transition-colors duration-[80ms] hover:border-ink"
    >
      <div className="flex aspect-[16/10] items-end bg-fill-2 p-2">
        <span className="font-mono text-meta text-ink-3">
          {project.project_code}
        </span>
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
