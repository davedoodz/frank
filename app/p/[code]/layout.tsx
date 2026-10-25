import { notFound } from "next/navigation";
import ProjectTopBar from "@/components/project/ProjectTopBar";
import { getFloors, getProject, getUnits } from "@/lib/data";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await getProject(decodeURIComponent(code));
  if (!project) notFound();

  const floors = await getFloors(project.id);
  const units = await getUnits(project.id);
  const index = units.map((u) => ({
    number: u.number,
    level: floors.find((f) => f.id === u.floor_id)?.level ?? 0,
  }));

  return (
    <div className="flex h-screen flex-col bg-surface">
      <ProjectTopBar
        code={project.project_code}
        displayName={project.display_name}
        units={index}
      />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
