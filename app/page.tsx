"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/app-shell";
import { FarmComparisonChart, OwnerWorkerChart, SalesTrendChart, type DailyPoint } from "./components/dashboard-charts";
import { ThaiMonthInput } from "./components/thai-month-input";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/packages/database/src/database.types";
import { average, bangkokMonth, comparisonAmount, delta, money, monthRange, previousMonth, totalRows, weight } from "@/lib/analytics";
import { thaiDate } from "@/lib/sales";
import "./dashboard.css";
import "./components/thai-month-input.css";

type Farm = Tables<"farms">;
type Sale = Tables<"sales">;
type Summary = { farm_id: string; total_amount: number; weight_kg: number; sale_count: number; owner_share: number; worker_share: number };
const blank = { total: 0n, weight: 0n, count: 0n, owner: 0n, worker: 0n };

export default function DashboardPage() {
  const [month, setMonth] = useState(bangkokMonth());
  const [farmId, setFarmId] = useState("");
  const [farms, setFarms] = useState<Farm[]>([]);
  const [current, setCurrent] = useState(blank);
  const [previous, setPrevious] = useState(blank);
  const [farmSummaries, setFarmSummaries] = useState<Summary[]>([]);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [latest, setLatest] = useState<Sale[]>([]);
  const [status, setStatus] = useState("กำลังโหลดข้อมูล…");

  const load = useCallback(async () => {
    setStatus("กำลังโหลดข้อมูล…");
    const client = createClient();
    const now = monthRange(month);
    const before = monthRange(previousMonth(month));
    let latestQuery = client.from("sales").select("*").gte("sale_date", now.start).lt("sale_date", now.end).order("sale_date", { ascending: false }).order("id", { ascending: false }).limit(4);
    if (farmId) latestQuery = latestQuery.eq("farm_id", farmId);
    const [farmResult, nowResult, beforeResult, salesResult, allFarmResult, dailyResult] = await Promise.all([
      client.from("farms").select("*").order("name"),
      client.rpc("sales_summary", { p_start: now.start, p_end: now.end, p_farm_id: farmId || undefined }),
      client.rpc("sales_summary", { p_start: before.start, p_end: before.end, p_farm_id: farmId || undefined }),
      latestQuery,
      client.rpc("sales_summary", { p_start: now.start, p_end: now.end, p_farm_id: farmId || undefined }),
      client.rpc("sales_daily_summary", { p_start: now.start, p_end: now.end, p_farm_id: farmId || undefined }),
    ]);
    if (farmResult.data) setFarms(farmResult.data);
    if (nowResult.error || beforeResult.error || salesResult.error || allFarmResult.error || dailyResult.error) {
      setStatus("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่");
      return;
    }
    setCurrent(totalRows(nowResult.data ?? []));
    setPrevious(totalRows(beforeResult.data ?? []));
    setFarmSummaries(allFarmResult.data ?? []);
    setDaily(dailyResult.data ?? []);
    setLatest(salesResult.data ?? []);
    setStatus("");
  }, [farmId, month]);

  useEffect(() => { void load(); }, [load]);
  const names = useMemo(() => Object.fromEntries(farms.map((farm) => [farm.id, farm.name])), [farms]);
  const todayMonth = bangkokMonth() === month;
  const avg = average(current);
  const farmPoints = farmSummaries.map((row) => ({ id: row.farm_id, label: names[row.farm_id] ?? "ฟาร์ม", total: totalRows([row]).total })).sort((a, b) => a.total === b.total ? 0 : a.total > b.total ? -1 : 1);
  const change = delta(current.total, previous.total);
  const trendNegative = current.total < previous.total;
  const cards = [
    { label: "ยอดขายรวม", value: `${money(current.total)} บาท`, detail: change, tone: "sales" },
    { label: "ส่วนเจ้าของ", value: `${money(current.owner)} บาท`, detail: "รวมจากยอดขายที่เลือก", tone: "owner" },
    { label: "ส่วนลูกจ้าง", value: `${money(current.worker)} บาท`, detail: "รวมจากยอดขายที่เลือก", tone: "worker" },
    { label: "เปรียบเทียบช่วงเวลา", value: `${comparisonAmount(current.total, previous.total)} บาท`, detail: change, tone: trendNegative ? "negative" : "comparison" },
  ];

  return <AppShell active="overview" title="ภาพรวม">
    <section className="page-intro"><div><p>ติดตามยอดขายและส่วนแบ่งของฟาร์มในช่วงเวลาที่เลือก</p><span className="period-chip">{todayMonth ? "ยอดสะสมถึงวันนี้ เทียบเดือนก่อนเต็มเดือน" : "เทียบกับเดือนก่อนหน้า"}</span></div><Link className="button primary" href="/sales/new">+ บันทึกการขาย</Link></section>
    <section className="filter-row"><label>ฟาร์ม<select value={farmId} onChange={(event) => setFarmId(event.target.value)}><option value="">ทุกฟาร์มที่มีสิทธิ์</option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select></label><label>เดือน<ThaiMonthInput value={month} onChange={setMonth} /></label></section>
    {status ? <section className="empty-state"><p>{status}</p></section> : <>
      <section className="kpi-grid" aria-label="ตัวชี้วัดหลัก">{cards.map((card) => <article className={`kpi-card kpi-${card.tone}`} key={card.label}><p>{card.label}</p><strong>{card.value}</strong><span>{card.detail}</span></article>)}</section>
      <section className="dashboard-panel panel"><div className="panel-heading"><div><h2>แนวโน้มยอดขาย</h2><p className="muted">ยอดขายรายวันในเดือนที่เลือก</p></div><b>{money(current.total)} บาท</b></div><SalesTrendChart points={daily} /></section>
      <section className="dashboard-chart-grid"><section className="panel"><div className="panel-heading"><div><h2>เปรียบเทียบยอดขายแต่ละฟาร์ม</h2><p className="muted">เรียงตามยอดขายในช่วงที่เลือก</p></div></div><FarmComparisonChart farms={farmPoints} /></section><section className="panel"><div className="panel-heading"><div><h2>ส่วนแบ่งเจ้าของและลูกจ้าง</h2><p className="muted">ส่วนแบ่งรวมเท่ากับยอดขายรวมเสมอ</p></div></div><OwnerWorkerChart totals={current} /></section></section>
      <section className="secondary-analytics" aria-label="ข้อมูลประกอบ"><span>น้ำหนักรวม <b>{weight(current.weight)} kg</b></span><span>ราคาเฉลี่ย/kg <b>{avg === null ? "—" : `${money(avg)} บาท`}</b></span><span>จำนวนครั้งที่ขาย <b>{current.count.toString()} ครั้ง</b></span></section>
      <section className="panel"><h2>รายการล่าสุด</h2>{latest.length === 0 ? <p className="muted">ยังไม่มีรายการขายในช่วงนี้</p> : <div className="latest-list">{latest.map((sale) => <Link key={sale.id} href={`/sales/${sale.id}`}><span>{thaiDate(sale.sale_date)} · {names[sale.farm_id] ?? "ฟาร์ม"}</span><b>{Number(sale.total_amount ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</b></Link>)}</div>}</section>
    </>}
  </AppShell>;
}
