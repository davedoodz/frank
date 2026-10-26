"use client";

import { useActionState } from "react";
import { signIn } from "./actions";
import { FIELD } from "@/components/ui/Action";

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
        aria-label="mot de passe"
        placeholder="mot de passe"
        className={`w-full ${FIELD}`}
      />
      {/* The only action on the screen, so it carries the green rather than
          sitting as an outline beside nothing. */}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex h-6 w-full items-center justify-center rounded-full bg-brand px-3 text-body font-medium text-ink transition-colors duration-[80ms] hover:bg-brand-2 disabled:opacity-50"
      >
        entrer
      </button>
      {state ? <div className="mt-2 text-meta text-ink-2">{state}</div> : null}
    </form>
  );
}
