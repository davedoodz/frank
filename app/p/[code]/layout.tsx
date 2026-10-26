import AppSidebar from "@/components/AppSidebar";
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
  const index = units.map((u) => {
    const floor = floors.find((f) => f.id === u.floor_id);
    return {
      number: u.number,
      level: floor?.level ?? 0,
      label: floor?.label ?? "",
    };
  });

  return (
    <div className="flex h-screen">
      <AppSidebar active="none" />
      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <ProjectTopBar project={project} units={index} />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
