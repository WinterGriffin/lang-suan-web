import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "./auth-controls";

type Section = "overview" | "sales" | "create" | "farms" | "reports";

const navigation: Array<{ href: string; label: string; icon: string; key: Section }> = [
  { href: "/", label: "ภาพรวม", icon: "◫", key: "overview" },
  { href: "/sales", label: "การขาย", icon: "▤", key: "sales" },
  { href: "/sales/new", label: "บันทึก", icon: "+", key: "create" },
  { href: "/farms", label: "ฟาร์ม", icon: "⌂", key: "farms" },
  { href: "/reports", label: "รายงาน", icon: "⌁", key: "reports" },
];

export function AppShell({ active, title, children }: { active: Section; title: string; children: ReactNode }) {
  return <div className="app-shell"><aside className="sidebar" aria-label="เมนูหลัก"><Link className="brand" href="/"><span>ล</span><b>หลังสวน</b><small>LANG SUAN</small></Link><nav>{navigation.map((item) => <NavLink key={item.key} item={item} active={active} />)}</nav><p className="sidebar-note">MVP 1.5<br />บันทึกยอดขายอย่างเรียบง่าย</p></aside><main className="main-content"><header className="topbar"><div><p className="eyebrow">หลังสวน / LANG SUAN</p><h1>{title}</h1></div><LogoutButton /></header>{children}</main><nav className="bottom-nav" aria-label="เมนูหลักบนมือถือ">{navigation.map((item) => <NavLink key={item.key} item={item} active={active} />)}</nav></div>;
}

function NavLink({ item, active }: { item: (typeof navigation)[number]; active: Section }) {
  return <Link href={item.href} className={item.key === active ? "nav-link active" : "nav-link"} aria-current={item.key === active ? "page" : undefined}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>;
}
