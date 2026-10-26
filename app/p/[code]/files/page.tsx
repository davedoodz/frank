import { notFound } from "next/navigation";
import ConnectFiles from "@/components/project/ConnectFiles";
import { getProject } from "@/lib/data";

/** Connections are session state, so this route is never prerendered. */
export const dynamic = "force-dynamic";

export default async function FilesPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await getProject(decodeURIComponent(code));
  if (!project) notFound();

  return <ConnectFiles project={project} />;
}
