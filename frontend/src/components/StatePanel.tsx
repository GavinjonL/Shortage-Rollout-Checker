import type { ReactNode } from "react";

type StateKind = "empty" | "error" | "loading";

export function StatePanel({ kind, title, message, action }: { kind: StateKind; title: string; message: string; action?: ReactNode }) {
  return <section className={`state-panel state-panel--${kind}`} role={kind === "error" ? "alert" : "status"}><span className="state-panel__icon" aria-hidden="true">{kind === "error" ? "!" : kind === "loading" ? "…" : "○"}</span><div><h2>{title}</h2><p>{message}</p>{action}</div></section>;
}
