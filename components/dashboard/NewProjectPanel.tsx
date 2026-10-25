"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createProjectAction } from "@/app/actions";

const fields = [
  { name: "display_name", label: "display name", type: "text" },
  { name: "project_code", label: "code", type: "text" },
  { name: "city", label: "city", type: "text" },
  { name: "year", label: "year", type: "number" },
  { name: "floors_count", label: "floors", type: "number" },
];

export default function NewProjectPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <aside className="w-[360px] shrink-0 overflow-auto border-l border-line bg-paper">
      <div className="flex h-12 items-center justify-between border-b border-line px-4">
        <span className="text-15 text-ink">new project</span>
        <button type="button" onClick={onClose} className="mono text-11 text-ink-2">
          close
        </button>
      </div>
      <form
        className="flex flex-col gap-4 p-4"
        action={(form) => {
          if (!String(form.get("display_name") ?? "").trim() || !String(form.get("project_code") ?? "").trim()) {
            setError("display name and code required");
            return;
          }
          setError("");
          startTransition(async () => {
            await createProjectAction(form);
            router.refresh();
            onClose();
          });
        }}
      >
        {fields.map((f) => (
          <label key={f.name} className="flex flex-col gap-1">
            <span className="label">{f.label}</span>
            <input
              name={f.name}
              type={f.type}
              className={`h-7 border border-line bg-paper px-2 text-13 outline-none focus:border-ink ${
                f.type === "number" ? "mono" : ""
              }`}
            />
          </label>
        ))}
        <div className="flex items-center gap-4 pt-2">
          <button type="submit" disabled={pending} className="h-7 border border-ink px-3 text-13 text-ink">
            create
          </button>
          {error ? <span className="mono text-11 text-ink-2">{error}</span> : null}
        </div>
      </form>
    </aside>
  );
}
