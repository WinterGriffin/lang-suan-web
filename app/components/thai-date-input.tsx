"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const weekdays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function toText(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${Number(match[1]) + 543}` : "";
}

function fromText(text: string) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const year = Number(match[3]) - 543;
  const month = Number(match[2]);
  const day = Number(match[1]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) return null;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function isoFor(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function ThaiDateInput({ id, value, onChange, max, describedBy }: { id?: string; value: string; onChange: (value: string) => void; max: string; describedBy?: string }) {
  const initial = new Date(`${/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : max}T00:00:00Z`);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(toText(value));
  const [view, setView] = useState({ year: initial.getUTCFullYear(), month: initial.getUTCMonth() });
  const input = useRef<HTMLInputElement>(null);
  const calendar = useRef<HTMLDivElement>(null);

  useEffect(() => { setText(toText(value)); }, [value]);
  useEffect(() => {
    if (open) window.requestAnimationFrame(() => calendar.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus());
  }, [open, value]);
  const days = useMemo(() => {
    const first = new Date(Date.UTC(view.year, view.month, 1)).getUTCDay();
    const last = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
    return [...Array(first).fill(null), ...Array.from({ length: last }, (_, index) => index + 1)];
  }, [view]);

  const select = (iso: string, close = true) => {
    if (iso <= max) {
      onChange(iso);
      const date = new Date(`${iso}T00:00:00Z`);
      setView({ year: date.getUTCFullYear(), month: date.getUTCMonth() });
      if (close) setOpen(false);
    }
  };
  const commitText = () => {
    const iso = fromText(text);
    if (iso && iso <= max) select(iso, false);
  };
  const shiftMonth = (direction: number) => setView(({ year, month }) => {
    const date = new Date(Date.UTC(year, month + direction, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
  });
  const moveDay = (amount: number) => {
    const base = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : max;
    const date = new Date(`${base}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    select(date.toISOString().slice(0, 10), false);
  };
  const calendarKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const movements: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); input.current?.focus(); return; }
    if (movements[event.key] !== undefined) { event.preventDefault(); moveDay(movements[event.key]); }
  };

  return <div className="thai-date-picker">
    <div className="thai-date-entry">
      <input id={id} ref={input} inputMode="numeric" value={text} placeholder="DD/MM/YYYY (พ.ศ.)" aria-describedby={describedBy} onChange={(event) => setText(event.target.value)} onBlur={commitText} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commitText(); } }} />
      <button type="button" className="profile-button" aria-label="เปิดปฏิทินภาษาไทย" aria-expanded={open} onClick={() => setOpen(!open)}>ปฏิทิน</button>
    </div>
    {open && <div ref={calendar} className="thai-calendar" role="dialog" aria-label="ปฏิทินภาษาไทย" onKeyDown={calendarKeys}>
      <div className="calendar-header"><button type="button" aria-label="เดือนก่อน" onClick={() => shiftMonth(-1)}>‹</button><strong>{months[view.month]} {view.year + 543}</strong><button type="button" aria-label="เดือนถัดไป" onClick={() => shiftMonth(1)}>›</button></div>
      <div className="calendar-grid" role="grid">{weekdays.map((day) => <span key={day} className="calendar-weekday">{day}</span>)}{days.map((day, index) => day === null ? <span key={`blank-${index}`} /> : <button key={day} type="button" role="gridcell" aria-label={`${day} ${months[view.month]} ${view.year + 543}`} disabled={isoFor(view.year, view.month, day) > max} aria-selected={value === isoFor(view.year, view.month, day)} onClick={() => select(isoFor(view.year, view.month, day))}>{day}</button>)}</div>
      <div className="calendar-footer"><button type="button" onClick={() => select(max)}>วันนี้</button><button type="button" onClick={() => setOpen(false)}>ปิด</button></div>
    </div>}
  </div>;
}
