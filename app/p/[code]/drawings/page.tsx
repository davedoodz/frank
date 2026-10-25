import { notFound } from "next/navigation";
import { getProject } from "@/lib/data";

const headers: [string, boolean][] = [
  ["file", false],
  ["kind", false],
  ["role", false],
  ["level", true],
  ["status", false],
  ["indexed", true],
];

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
            {headers.map(([label, numeric]) => (
              <th
                key={label}
                className={`label-11 h-8 border-b border-line px-3 ${
                  numeric ? "text-right" : "text-left"
                }`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {project.drawings.map((d) => (
            <tr key={d.filename} className="h-7 border-b border-line">
              <td className="px-3 font-mono text-meta text-ink">{d.filename}</td>
              <td className="px-3 font-mono text-meta text-ink-3">{d.kind}</td>
              <td className="px-3 text-body text-ink-2">{d.role.replace("_", " ")}</td>
              <td className="px-3 text-right font-mono text-meta">
                {d.floor_level ?? "—"}
              </td>
              <td className="px-3 font-mono text-meta text-ink-2">{d.status}</td>
              <td className="px-3 text-right font-mono text-meta text-ink-3">
                {d.indexed_at ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-4 text-meta text-ink-2">
        {project.drawings.length} connected files
      </div>
    </div>
  );
}
