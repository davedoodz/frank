"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

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
        className="h-6 w-full border border-line px-2 text-body text-ink focus:border-ink-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-6 w-full border border-line text-body text-ink-2 transition-colors duration-[80ms] hover:border-ink hover:text-ink"
      >
        enter
      </button>
      {state ? <div className="mt-2 text-meta text-ink-2">{state}</div> : null}
    </form>
  );
}
