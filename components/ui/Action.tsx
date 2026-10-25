/**
 * The one button shape: 24 px, 1 px line border, ink-2 text that goes to ink on
 * hover. No fill, no shadow, no radius above 2 px.
 */
export const ACTION =
  "h-6 border border-line px-2.5 text-body text-ink-2 transition-colors duration-[80ms] hover:border-ink hover:text-ink";

/** Search and chips are the only stadium shapes. */
export const SEARCH =
  "h-6 rounded-full border border-line px-2.5 text-body text-ink focus:border-ink-2 [&::-webkit-search-cancel-button]:appearance-none";
