"use client";

import { useTransition } from "react";
import {
  ACTION,
  SEGMENT,
  SEGMENT_OFF,
  SEGMENT_ON,
  SEGMENT_SHELL,
} from "@/components/ui/Action";
import {
  AREA_LABEL,
  DENSITY_LABEL,
  type AreaUnit,
  type Density,
  type Prefs,
} from "@/lib/prefs";
import {
  resetPrefsAction,
  setAreaAction,
  setDensityAction,
  setLowConfidenceAction,
  setTypologyFillsAction,
} from "@/app/settings/actions";

const AREA_OPTIONS: AreaUnit[] = ["m2", "ft2", "both"];
const DENSITY_OPTIONS: Density[] = ["regular", "dense"];
const CONFIDENCE_OPTIONS = [0.5, 0.6, 0.7, 0.8, 0.9];

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-line py-4">
      <div className="label-11 text-ink-3">{label}</div>
      <div className="text-body text-ink-2">{description}</div>
      <div className="flex">{children}</div>
    </div>
  );
}

export default function SettingsPanel({ prefs }: { prefs: Prefs }) {
  const [, startTransition] = useTransition();

  return (
    <div className="mt-6">
      <Row
        label="unité de superficie"
        description="comment les m² et les ft² s’affichent dans le tableau des unités, les statistiques d’étage et le panneau d’unité."
      >
        <div className={SEGMENT_SHELL}>
          {AREA_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`${SEGMENT} ${prefs.area === opt ? SEGMENT_ON : SEGMENT_OFF}`}
              onClick={() => startTransition(() => setAreaAction(opt))}
            >
              {AREA_LABEL[opt]}
            </button>
          ))}
        </div>
      </Row>

      <Row
        label="seuil de confiance faible"
        description="un champ extrait sous ce seuil de confiance s’affiche atténué avec un soulignement pointillé, dans le tableau des unités et le panneau d’unité."
      >
        <div className={SEGMENT_SHELL}>
          {CONFIDENCE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`${SEGMENT} font-mono ${
                prefs.lowConfidence === opt ? SEGMENT_ON : SEGMENT_OFF
              }`}
              onClick={() => startTransition(() => setLowConfidenceAction(opt))}
            >
              {opt.toFixed(1)}
            </button>
          ))}
        </div>
      </Row>

      <Row
        label="densité"
        description="la hauteur des lignes dans le tableau des unités et dans le tableau d’unités à côté du plan."
      >
        <div className={SEGMENT_SHELL}>
          {DENSITY_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`${SEGMENT} ${prefs.density === opt ? SEGMENT_ON : SEGMENT_OFF}`}
              onClick={() => startTransition(() => setDensityAction(opt))}
            >
              {DENSITY_LABEL[opt]}
            </button>
          ))}
        </div>
      </Row>

      <Row
        label="remplissages de typologie"
        description="si un plan d’étage s’ouvre avec ses remplissages de typologie déjà appliqués."
      >
        <div className={SEGMENT_SHELL}>
          <button
            type="button"
            className={`${SEGMENT} ${prefs.typologyFills ? SEGMENT_ON : SEGMENT_OFF}`}
            onClick={() => startTransition(() => setTypologyFillsAction(true))}
          >
            activés
          </button>
          <button
            type="button"
            className={`${SEGMENT} ${!prefs.typologyFills ? SEGMENT_ON : SEGMENT_OFF}`}
            onClick={() => startTransition(() => setTypologyFillsAction(false))}
          >
            désactivés
          </button>
        </div>
      </Row>

      <div className="pt-4">
        <button
          type="button"
          className={ACTION}
          onClick={() => startTransition(() => resetPrefsAction())}
        >
          rétablir les valeurs par défaut
        </button>
      </div>
    </div>
  );
}
