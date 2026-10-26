/**
 * The one button shape: a 24 px stadium, 1 px line border, ink-2 text that goes
 * to ink on hover. No fill, no shadow, no corner.
 */
export const ACTION =
  "flex h-6 items-center rounded-full border border-line px-3 text-body text-ink-2 transition-colors duration-[80ms] hover:border-ink hover:text-ink";

/** Search is the same stadium, carrying ink text instead of a label. */
export const SEARCH =
  "h-6 rounded-full border border-line px-3 text-body text-ink focus:border-ink-2 [&::-webkit-search-cancel-button]:appearance-none";

/** A text field in a panel or a form: the stadium again, at the same height. */
export const FIELD =
  "h-6 rounded-full border border-line px-3 text-body text-ink focus:border-ink-2";

/** The sort control: a stadium with the platform arrow replaced by our own. */
export const SELECT =
  "select-pill h-6 rounded-full border border-line bg-transparent pl-3 pr-6 text-body text-ink-2 transition-colors duration-[80ms] hover:border-ink hover:text-ink";

/**
 * Segmented controls are a stadium inside a stadium. The shell is 28 px with a
 * 1 px border and 3 px of padding, so its 14 px outer radius sits exactly 4 px
 * outside the 10 px radius of a 20 px segment. The two curves are concentric.
 */
export const SEGMENT_SHELL =
  "flex shrink-0 items-center gap-px h-7 rounded-full border border-line p-[3px]";

export const SEGMENT =
  "flex h-5 items-center rounded-full px-2.5 text-body transition-colors duration-[80ms]";

/* Selected is the office green, here and in every other control. Inverting to
   ink was the old rule; keeping both gave the product two "on" states. */
export const SEGMENT_ON = "bg-brand font-medium text-ink";
export const SEGMENT_OFF = "text-ink-3 hover:bg-fill-2 hover:text-ink";
