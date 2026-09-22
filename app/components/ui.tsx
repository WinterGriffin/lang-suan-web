import type { ReactNode } from "react";

export function Placeholder({ title, detail }: { title: string; detail: string }) { return <section className="empty-state"><div className="empty-icon" aria-hidden="true">◌</div><h2>{title}</h2><p>{detail}</p></section>; }
export function Panel({ title, children }: { title: string; children: ReactNode }) { return <section className="panel"><h2>{title}</h2>{children}</section>; }
