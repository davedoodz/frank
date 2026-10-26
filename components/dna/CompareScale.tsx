/**
 * Decorative plan furniture: a north arrow and a drawn scale bar, the way the
 * archived sheets carry them. The scale bar always reads in metres — it is a
 * fixed legend against the field of view, not the office's display unit.
 */
export function NorthArrow({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex h-7 w-7 items-center justify-center rounded-full border border-edge bg-panel/90 ${className}`}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" className="absolute top-1 text-text-2">
        <path d="M5 0 L8 6 L5 4.5 L2 6 Z" fill="currentColor" />
      </svg>
      <span className="mt-2 text-[9px] font-semibold text-text-2">N</span>
    </div>
  );
}

const SCALE_TICKS = [0, 1, 2, 5];

/**
 * The bar is drawn as a share of the plan's own width, so five metres on the
 * legend is five metres on the drawing at any zoom.
 *
 * @param fieldWidthM metres spanned by the crop this bar sits on
 */
export function ScaleBar({
  fieldWidthM,
  className = "",
}: {
  fieldWidthM: number;
  className?: string;
}) {
  const span = Math.min(5 / Math.max(fieldWidthM, 1), 1);

  return (
    <div
      className={`flex flex-col gap-1 ${className}`}
      style={{ width: `${span * 100}%` }}
    >
      <div className="relative h-2">
        <div className="absolute inset-x-0 top-1 h-px bg-text-3" />
        {SCALE_TICKS.map((t) => (
          <div
            key={t}
            className="absolute top-0 h-2 w-px bg-text-3"
            style={{ left: `${(t / 5) * 100}%` }}
          />
        ))}
      </div>
      <div className="relative h-3 font-mono text-[10px] text-text-3">
        {SCALE_TICKS.map((t) => (
          <span
            key={t}
            className="absolute -translate-x-1/2"
            style={{ left: `${(t / 5) * 100}%` }}
          >
            {t === 5 ? "5 m" : t}
          </span>
        ))}
      </div>
    </div>
  );
}
