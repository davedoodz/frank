/**
 * Control shapes for the product chrome: 36 px high, 8 px radius, one border.
 * Four intents only — neutral, selected, dark (primary), blue (handoff).
 */
export const BTN =
  "inline-flex h-9 shrink-0 items-center whitespace-nowrap gap-2 rounded-lg border border-edge bg-panel px-3 text-[13px] font-medium text-text transition-colors hover:bg-app disabled:opacity-50";

export const BTN_ON =
  "inline-flex h-9 shrink-0 items-center whitespace-nowrap gap-2 rounded-lg border border-brand-line bg-brand-soft px-3 text-[13px] font-medium text-text transition-colors";

export const BTN_DARK =
  "inline-flex h-9 shrink-0 items-center whitespace-nowrap justify-center gap-2 rounded-lg border border-transparent bg-nav px-3 text-[13px] font-medium text-white transition-colors hover:bg-nav-2 disabled:opacity-50";

export const BTN_BRAND =
  "inline-flex h-9 shrink-0 items-center whitespace-nowrap justify-center gap-2 rounded-lg border border-transparent bg-brand px-3 text-[13px] font-medium text-text transition-colors hover:bg-brand-2 disabled:opacity-50";

export const BTN_QUIET =
  "inline-flex h-9 shrink-0 items-center whitespace-nowrap gap-2 rounded-lg px-2.5 text-[13px] text-text-2 transition-colors hover:bg-app hover:text-text";

/** Icon-only control, square. */
export const BTN_ICON =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-panel text-text-2 transition-colors hover:bg-app hover:text-text";
