"use client";

import { useEffect, useRef, useState } from "react";

const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function parseMonth(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return match ? { year: Number(match[1]), month: Number(match[2]) - 1 } : null;
}

function toValue(year: number, month: number) {
  return `${year.toString().padStart(4, "0")}-${(month + 1).toString().padStart(2, "0")}`;
}

function currentBangkokMonth() {
  return parseMonth(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit" }).format(new Date()).replace("/", "-"))!;
}

export function ThaiMonthInput({ value, onChange, label = "เดือน" }: { value: string; onChange: (value: string) => void; label?: string }) {
  const selected = parseMonth(value) ?? currentBangkokMonth();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(selected.year);
  const trigger = useRef<HTMLButtonElement>(null);
  const calendar = useRef<HTMLDivElement>(null);

  useEffect(() => { setYear(selected.year); }, [selected.year]);
  useEffect(() => {
    if (open) window.requestAnimationFrame(() => calendar.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus());
  }, [open, value, year]);

  const choose = (nextYear: number, nextMonth: number, close = true) => {
    onChange(toValue(nextYear, nextMonth));
    setYear(nextYear);
    if (close) { setOpen(false); trigger.current?.focus(); }
  };
  const moveMonth = (amount: number) => {
    const date = new Date(Date.UTC(selected.year, selected.month + amount, 1));
    choose(date.getUTCFullYear(), date.getUTCMonth(), false);
  };
  const onCalendarKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const movements: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); return; }
    if (movements[event.key] !== undefined) { event.preventDefault(); moveMonth(movements[event.key]); }
  };

  return <div className="thai-month-picker">
    <button ref={trigger} type="button" className="thai-month-trigger" aria-label={`${label} ${months[selected.month]} ${selected.year + 543}`} aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      <span>{months[selected.month]} {selected.year + 543}</span><span aria-hidden="true">▦</span>
    </button>
    {open && <div ref={calendar} className="thai-month-calendar" role="dialog" aria-label={`ปฏิทินเลือก${label}`} onKeyDown={onCalendarKeyDown}>
      <div className="month-calendar-header"><button type="button" aria-label="ปีก่อน" onClick={() => setYear((current) => current - 1)}>‹</button><strong>ปี {year + 543}</strong><button type="button" aria-label="ปีถัดไป" onClick={() => setYear((current) => current + 1)}>›</button></div>
      <div className="month-calendar-grid" role="grid">{months.map((month, index) => <button key={month} type="button" role="gridcell" aria-selected={value === toValue(year, index)} onClick={() => choose(year, index)}>{month}</button>)}</div>
      <div className="month-calendar-footer"><button type="button" onClick={() => { const current = currentBangkokMonth(); choose(current.year, current.month); }}>เดือนนี้</button><button type="button" onClick={() => { setOpen(false); trigger.current?.focus(); }}>ปิด</button></div>
    </div>}
  </div>;
}
