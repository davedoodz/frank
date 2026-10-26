"use client";

import { useTransition } from "react";
import { setUnitVerifiedAction } from "@/app/p/[code]/units/actions";
import { BTN } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import type { UnitStatus } from "@/lib/types";

/**
 * The one write the plan makes against an indexed unit. The status row above
 * carries the state, so this control only ever reads as an instruction.
 */
export default function VerifyButton({
  code,
  unitId,
  status,
}: {
  code: string;
  unitId: string;
  status: UnitStatus;
}) {
  const [pending, startTransition] = useTransition();
  const verified = status === "verified";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => setUnitVerifiedAction(code, unitId, !verified))
      }
      className={`${BTN} justify-center`}
    >
      <Icon name="check" size={14} />
      {verified ? "Annuler la vérification" : "Marquer comme vérifiée"}
    </button>
  );
}
