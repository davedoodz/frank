/**
 * The icon set, from Lucide (https://lucide.dev/icons/).
 *
 * Every icon in the interface comes through this one map, so a name means the
 * same thing on the rail, in a table and on a button, and the whole set can be
 * re-pointed in one file. Lucide draws on a 24 px grid; the old hand-drawn set
 * used 16 px. `strokeWidth` stays in the old units and is converted once below,
 * so a 1.4 here keeps the hairline weight the rest of the interface was tuned
 * against, at any size.
 */
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Box,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dna,
  Download,
  DraftingCompass,
  ExternalLink,
  File,
  FileBox,
  Info,
  Layers,
  LayoutGrid,
  type LucideIcon,
  MapPin,
  Maximize,
  Minus,
  PencilRuler,
  Plus,
  Search,
  Settings,
  Table,
  Tag,
  Users,
  X,
} from "lucide-react";

export type IconName =
  | "arrow-up"
  | "arrow-down"
  | "grid"
  | "layers"
  | "dna"
  | "drawing"
  | "building"
  | "team"
  | "settings"
  | "search"
  | "bell"
  | "file"
  | "dwg"
  | "export"
  | "check"
  | "chevron-right"
  | "chevron-down"
  | "chevron-left"
  | "plus"
  | "minus"
  | "expand"
  | "external"
  | "cad"
  | "cube"
  | "table"
  | "info"
  | "pin"
  | "label"
  | "close";

const ICONS: Record<IconName, LucideIcon> = {
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  grid: LayoutGrid,
  layers: Layers,
  dna: Dna,
  drawing: DraftingCompass,
  building: Building2,
  team: Users,
  settings: Settings,
  search: Search,
  bell: Bell,
  file: File,
  dwg: FileBox,
  export: Download,
  check: Check,
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  plus: Plus,
  minus: Minus,
  expand: Maximize,
  external: ExternalLink,
  cad: PencilRuler,
  cube: Box,
  table: Table,
  info: Info,
  pin: MapPin,
  label: Tag,
  close: X,
};

/** 1.4 on the old 16 px grid is 2.1 on Lucide's 24 px grid, at any size. */
const STROKE_SCALE = 24 / 16;

export default function Icon({
  name,
  size = 16,
  className = "",
  strokeWidth = 1.4,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Glyph = ICONS[name];
  return (
    <Glyph
      width={size}
      height={size}
      strokeWidth={strokeWidth * STROKE_SCALE}
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    />
  );
}
