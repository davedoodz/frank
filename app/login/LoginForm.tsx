"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, "");

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <input
        name="password"
        type="password"
        autoFocus
        autoComplete="current-password"
        className="h-7 w-full border border-line bg-paper px-2 text-13 outline-none focus:border-ink"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-7 w-full border border-ink bg-paper text-13 text-ink"
      >
        enter
      </button>
      {state ? <div className="mono text-11 text-ink-2">{state}</div> : null}
    </form>
  );
}
