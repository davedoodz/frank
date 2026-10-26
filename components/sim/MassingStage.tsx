import { levelBand } from "@/lib/massing";
import type { MassingModel } from "@/lib/types";

/**
 * The massing model as it sits in the SketchUp viewport: a static render of
 * the SKP with the selected level band outlined in SketchUp's selection blue.
 * Axes are drawn flat, the way the host shows them at the model origin.
 */
export default function MassingStage({
  model,
  highlight = [],
  pending = [],
}: {
  model: MassingModel;
  /** Levels already assigned, drawn solid. */
  highlight?: number[];
  /** The level being assigned right now, drawn dashed. */
  pending?: number[];
}) {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div
        className="relative max-h-full"
        style={{
          aspectRatio: `${model.render_width} / ${model.render_height}`,
          height: "100%",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={model.render_url}
          alt={`Modèle volumétrique ${model.model_ref}`}
          className="block h-full w-full object-fill"
        />
        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {highlight.map((level) => {
            const band = levelBand(model, level);
            return band ? (
              <polygon
                key={`on-${level}`}
                points={band}
                fill="#4A90E2"
                fillOpacity={0.22}
                stroke="#4A90E2"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ) : null;
          })}
          {pending.map((level) => {
            const band = levelBand(model, level);
            return band ? (
              <polygon
                key={`pending-${level}`}
                points={band}
                fill="#4A90E2"
                fillOpacity={0.12}
                stroke="#4A90E2"
                strokeWidth={2}
                strokeDasharray="6 4"
                vectorEffect="non-scaling-stroke"
              />
            ) : null;
          })}
        </svg>

        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute bottom-4 left-4 h-20 w-20"
        >
          <line x1="20" y1="80" x2="95" y2="62" stroke="#C0392B" strokeWidth="1.5" />
          <line x1="20" y1="80" x2="5" y2="55" stroke="#2E7D32" strokeWidth="1.5" />
          <line x1="20" y1="80" x2="20" y2="10" stroke="#1565C0" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
