import { notFound } from "next/navigation";
import { getProject } from "@/lib/data";

export default async function DrawingsTab({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await getProject(decodeURIComponent(code));
  if (!project) notFound();

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="sticky top-0 bg-surface">
            <th className="label h-8 border-b border-line px-3 text-left">file</th>
            <th className="label h-8 border-b border-line px-3 text-left">kind</th>
            <th className="label h-8 border-b border-line px-3 text-left">role</th>
            <th className="label h-8 border-b border-line px-3 text-right">level</th>
            <th className="label h-8 border-b border-line px-3 text-left">status</th>
            <th className="label h-8 border-b border-line px-3 text-right">indexed</th>
          </tr>
        </thead>
        <tbody>
          {project.drawings.map((d) => (
            <tr key={d.filename} className="h-7 border-b border-line">
              <td className="mono px-3 text-11 text-ink">{d.filename}</td>
              <td className="mono px-3 text-11 text-ink-2">{d.kind}</td>
              <td className="px-3 text-13 text-ink-2">{d.role.replace("_", " ")}</td>
              <td className="mono px-3 text-right text-11">{d.floor_level ?? "—"}</td>
              <td className="mono px-3 text-11 text-ink-2">{d.status}</td>
              <td className="mono px-3 text-right text-11 text-ink-2">
                {d.indexed_at ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {project.drawings.length === 0 ? (
        <div className="px-3 py-3 text-13 text-ink-3">no connected files</div>
      ) : null}
    </div>
  );
}
