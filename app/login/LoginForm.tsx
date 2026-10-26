"use client";

import { useActionState } from "react";
import { signIn } from "./actions";
import { ACTION, FIELD } from "@/components/ui/Action";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, "");

  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />
      <input
        name="password"
        type="password"
        autoFocus
        autoComplete="current-password"
        aria-label="password"
        className={`w-full ${FIELD}`}
      />
      <button
        type="submit"
        disabled={pending}
        className={`mt-2 w-full justify-center ${ACTION}`}
      >
        enter
      </button>
      {state ? <div className="mt-2 text-meta text-ink-2">{state}</div> : null}
    </form>
  );
}
