import Link from "next/link";

/**
 * The one piece of inverted surface in the app: a 200 px rail that stays put
 * while the project changes. Items that belong to a later round sit at ink-3
 * and do not respond to the pointer.
 */
export default function AppSidebar({ active }: { active: "projects" | "none" }) {
  return (
    <aside className="flex w-[200px] shrink-0 flex-col bg-ink p-2 text-paper">
      <Link href="/" className="flex h-12 items-center px-2.5 text-body">
        fitte.
      </Link>

      <nav className="mt-2 flex flex-col gap-px">
        <Link
          href="/"
          className={`flex h-7 items-center rounded-full px-2.5 text-body transition-colors duration-[80ms] ${
            active === "projects"
              ? "bg-paper text-ink"
              : "text-paper/70 hover:bg-white/10 hover:text-paper"
          }`}
        >
          projects
        </Link>
        {["office dna", "library", "settings"].map((label) => (
          <span
            key={label}
            className="flex h-7 items-center rounded-full px-2.5 text-body text-paper/35"
          >
            {label}
          </span>
        ))}
      </nav>

      <div className="mt-auto px-2.5 pb-2 font-mono text-meta whitespace-nowrap text-paper/35">
        fixture data
      </div>
    </aside>
  );
}
