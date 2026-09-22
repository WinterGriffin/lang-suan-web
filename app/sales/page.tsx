"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/app-shell";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/packages/database/src/database.types";
import { bangkokMonth, money, monthRange, totalRows } from "@/lib/analytics";
import { thaiDate } from "@/lib/sales";
import { ThaiMonthInput } from "../components/thai-month-input";
import "./sales.css";
import "../components/thai-month-input.css";

type Farm = Tables<"farms">; type Sale = Tables<"sales">;
type Cursor = Pick<Sale, "sale_date" | "id">;
const pageSize = 25;

export default function SalesPage() {
  const [farms, setFarms] = useState<Farm[]>([]); const [sales, setSales] = useState<Sale[]>([]); const [month, setMonth] = useState(bangkokMonth()); const [farmId, setFarmId] = useState("");
  const [summary, setSummary] = useState({ total: 0n, weight: 0n, count: 0n, owner: 0n, worker: 0n }); const [cursor, setCursor] = useState<Cursor | null>(null); const [next, setNext] = useState<Cursor | null>(null); const [history, setHistory] = useState<Array<Cursor | null>>([]); const [status, setStatus] = useState("กำลังโหลดข้อมูล…"); const [loading, setLoading] = useState(true);
  const names = useMemo(() => Object.fromEntries(farms.map((farm) => [farm.id, farm.name])), [farms]);
  const load = useCallback(async (after: Cursor | null = null) => {
    setLoading(true); setStatus("กำลังโหลดข้อมูล…"); const client = createClient(); const { start, end } = monthRange(month);
    let query = client.from("sales").select("*").gte("sale_date", start).lt("sale_date", end).order("sale_date", { ascending: false }).order("id", { ascending: false }).limit(pageSize + 1);
    if (farmId) query = query.eq("farm_id", farmId);
    if (after) query = query.or(`sale_date.lt.${after.sale_date},and(sale_date.eq.${after.sale_date},id.lt.${after.id})`);
    const [farmResult, saleResult, sumResult] = await Promise.all([client.from("farms").select("*").order("name"), query, client.rpc("sales_summary", { p_start: start, p_end: end, p_farm_id: farmId || undefined })]);
    if (farmResult.data) setFarms(farmResult.data);
    if (saleResult.error || sumResult.error) { setStatus("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่"); setLoading(false); return; }
    const rows = saleResult.data ?? []; const visible = rows.slice(0, pageSize); setSales(visible); setNext(rows.length > pageSize ? { sale_date: visible.at(-1)!.sale_date, id: visible.at(-1)!.id } : null); setCursor(after); setSummary(totalRows(sumResult.data ?? [])); setStatus(visible.length ? "" : "ยังไม่มีรายการขายในช่วงนี้"); setLoading(false);
  }, [farmId, month]);
  useEffect(() => { setHistory([]); void load(); }, [load]);
  const nextPage = () => { if (!next || loading) return; setHistory((items) => [...items, cursor]); void load(next); };
  const previousPage = () => { if (!history.length || loading) return; const target = history.at(-1) ?? null; setHistory((items) => items.slice(0, -1)); void load(target); };
  const firstPage = () => { setHistory([]); void load(null); };
  return <AppShell active="sales" title="รายการขาย"><section className="page-intro"><p>ค้นหาและดูรายการขายตามฟาร์มและเดือน</p><Link className="button primary" href="/sales/new">+ บันทึกการขาย</Link></section>
    <section className="filter-row" aria-label="ตัวกรองรายการขาย"><label>ฟาร์ม<select value={farmId} onChange={(event) => setFarmId(event.target.value)}><option value="">ทุกฟาร์มที่มีสิทธิ์</option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select></label><label>เดือน<ThaiMonthInput value={month} onChange={setMonth} /></label></section>
    <section className="sales-total panel" aria-live="polite"><span>{summary.count.toString()} รายการ</span><strong>{money(summary.total)} บาท</strong><small>ยอดรวมคำนวณจากทุกรายการในช่วง ไม่ใช่เฉพาะหน้านี้</small></section>
    {loading ? <section className="empty-state"><p>กำลังโหลดข้อมูล…</p></section> : status ? <section className="empty-state"><h2>{status}</h2><p>เปลี่ยนเดือน/ฟาร์ม หรือบันทึกรายการขายใหม่</p></section> : <><section className="sales-table" aria-label="รายการขาย"><div className="sales-head"><span>วันที่</span><span>ฟาร์ม</span><span>น้ำหนัก × ราคา</span><span>ยอดรวม</span><span> </span></div>{sales.map((sale) => <article className="sales-row" key={sale.id}><span>{thaiDate(sale.sale_date)}</span><span>{names[sale.farm_id] ?? "ฟาร์มที่มีสิทธิ์"}</span><span>{sale.weight_kg} kg × {Number(sale.unit_price).toFixed(2)}</span><b>{Number(sale.total_amount ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</b><Link className="profile-button" href={`/sales/${sale.id}`}>รายละเอียด</Link></article>)}</section><nav className="pagination" aria-label="การแบ่งหน้า"><button className="profile-button" disabled={!history.length || loading} onClick={firstPage}>หน้าแรก</button><button className="profile-button" disabled={!history.length || loading} onClick={previousPage}>ก่อนหน้า</button><span aria-current="page">หน้า {history.length + 1}</span><button className="profile-button" disabled={!next || loading} onClick={nextPage}>ถัดไป</button></nav></>}</AppShell>;
}
