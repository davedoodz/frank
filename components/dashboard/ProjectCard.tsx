import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { projectThumb, since } from "@/lib/format";
import type { Project } from "@/lib/types";
import { StatusChip } from "./Dashboard";

/**
 * One card per project: render, name, where, how big, lifecycle, when it last
 * moved. The render is a placeholder crop; a project created in this session
 * has none and keeps a flat block carrying its code.
 */
export default function ProjectCard({ project }: { project: Project }) {
  const thumb = projectThumb(project.project_code);

  return (
    <Link
      href={`/p/${project.project_code}`}
      className="panel group flex flex-col overflow-hidden transition-shadow hover:shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
    >
      <div className="relative flex aspect-[16/9] items-end bg-app p-2">
        {thumb ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumb}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="text-[11px] text-text-3">
            {project.project_code}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="text-[14px] font-semibold text-text">
          {project.display_name}
        </div>

        <div className="flex items-center gap-1.5 text-[12px] text-text-2">
          <Icon name="pin" size={13} className="text-text-3" />
          {project.city}, {project.province}
        </div>

        <div className="text-[12px] text-text-2">
          {project.units_count} unité{project.units_count === 1 ? "" : "s"} ·{" "}
          {project.floors_count} étage{project.floors_count === 1 ? "" : "s"}
        </div>

        <div className="pt-1">
          <StatusChip status={project.status} />
        </div>

        <div className="mt-auto flex items-center gap-1.5 pt-3 text-[12px] text-text-3">
          {since(project.updated_at)}
          {project.last_import_at ? (
            <Icon name="check" size={13} className="text-ok" />
          ) : null}
        </div>
      </div>
    </Link>
  );
}
