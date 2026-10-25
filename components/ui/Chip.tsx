"use client";

/**
 * Stadium in stadium: the row and its count share a fully rounded end, so the
 * two curves are concentric. Active inverts: ink fill, paper text. A zero count
 * is not selectable unless it is already active, so a filter can still be
 * cleared.
 */
export function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const dead = count === 0 && !active;

  const row = active
    ? "bg-ink text-paper"
    : dead
      ? "text-ink-3"
      : "text-ink hover:bg-fill-2";

  const badge = active
    ? "bg-paper text-ink"
    : dead
      ? "text-ink-3 ring-1 ring-line ring-inset"
      : "bg-fill-2 text-ink-2 group-hover:bg-paper";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={dead}
      aria-pressed={active}
      className={`group flex h-6 shrink-0 items-center gap-2 rounded-full py-0 pr-[3px] pl-2.5 text-left text-body transition-colors duration-[80ms] disabled:cursor-default ${row}`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`flex h-[18px] min-w-[18px] flex-none items-center justify-center rounded-full px-[5px] font-mono text-meta tabular-nums transition-colors duration-[80ms] ${badge}`}
      >
        {count}
      </span>
    </button>
  );
}
