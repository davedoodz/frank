import Icon, { type IconName } from "@/components/ui/Icon";

const MENUS = [
  "Fichier",
  "Édition",
  "Affichage",
  "Caméra",
  "Dessiner",
  "Outils",
  "Fenêtre",
  "Extensions",
  "Aide",
];

const TOOLS: IconName[] = [
  "pin",
  "drawing",
  "ruler",
  "scale",
  "rotate",
  "zoom",
  "cube",
  "layers",
  "sun",
];

/**
 * SketchUp's chrome, reproduced flat: menu bar, toolbar, viewport, right tray,
 * status bar and measurements box. Nothing here is connected to an installed
 * application. The `simulated` label stays in the bottom-left of the viewport.
 */
export default function SketchUpChrome({
  title,
  status,
  measurement,
  tray,
  children,
}: {
  title: string;
  status: string;
  measurement: string;
  tray: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-[#E8E8E8] text-[#1F1F1F]">
      <div className="flex h-7 shrink-0 items-center gap-4 border-b border-[#C8C8C8] bg-[#F3F3F3] px-3 text-[12px] text-[#3A3A3A]">
        <span className="font-medium">{title}</span>
        <span className="flex-1" />
        {MENUS.map((menu) => (
          <span
            key={menu}
            className={menu === "Extensions" ? "text-[#1F1F1F]" : "text-[#5A5A5A]"}
          >
            {menu}
          </span>
        ))}
      </div>

      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-[#C8C8C8] bg-[#ECECEC] px-2">
        {TOOLS.map((tool, i) => (
          <span
            key={tool}
            className={`flex h-7 w-7 items-center justify-center rounded-[3px] border text-[#3A3A3A] ${
              i === 0
                ? "border-[#9EC5E8] bg-[#D6E8F8]"
                : "border-transparent bg-transparent"
            }`}
          >
            <Icon name={tool} size={15} />
          </span>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 overflow-hidden bg-gradient-to-b from-[#C9DCEE] via-[#EFF3F6] to-[#DCDCD8]">
          {children}
          <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[11px] text-[#6B7177]">
            simulé
          </span>
        </div>

        <aside className="flex w-[300px] shrink-0 flex-col border-l border-[#C8C8C8] bg-[#F3F3F3]">
          <div className="flex h-7 shrink-0 items-center gap-2 border-b border-[#C8C8C8] bg-[#E4E4E4] px-2 text-[12px] text-[#3A3A3A]">
            <Icon name="chevron-down" size={12} />
            <span className="font-medium">fitte</span>
            <span className="flex-1" />
            <Icon name="close" size={12} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-app p-4">{tray}</div>
        </aside>
      </div>

      <div className="flex h-7 shrink-0 items-center gap-3 border-t border-[#C8C8C8] bg-[#F3F3F3] px-3 text-[12px] text-[#4A4A4A]">
        <span className="truncate">{status}</span>
        <span className="flex-1" />
        <span className="text-[#6B6B6B]">Mesures</span>
        <span className="flex h-5 w-[180px] items-center rounded-[2px] border border-[#BDBDBD] bg-white px-2 font-mono text-[11px]">
          {measurement}
        </span>
      </div>
    </div>
  );
}
