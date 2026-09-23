export type SummaryRow = { total_amount: number; weight_kg: number; sale_count: number; owner_share: number; worker_share: number };
export type Totals = { total: bigint; weight: bigint; count: bigint; owner: bigint; worker: bigint };

const units = (value: number, scale: 2 | 3) => {
  const [whole, fraction = ""] = String(value).split(".");
  return BigInt(whole) * 10n ** BigInt(scale) + BigInt((fraction + "0".repeat(scale)).slice(0, scale));
};

export function totalRows(rows: SummaryRow[]): Totals {
  return rows.reduce<Totals>((all, row) => ({ total: all.total + units(row.total_amount, 2), weight: all.weight + units(row.weight_kg, 3), count: all.count + BigInt(row.sale_count), owner: all.owner + units(row.owner_share, 2), worker: all.worker + units(row.worker_share, 2) }), { total: 0n, weight: 0n, count: 0n, owner: 0n, worker: 0n });
}

export const money = (value: bigint) => `${(value / 100n).toLocaleString("th-TH")}.${(value % 100n).toString().padStart(2, "0")}`;
export const weight = (value: bigint) => { const text = `${value / 1000n}.${(value % 1000n).toString().padStart(3, "0")}`; return text.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1"); };
export const average = (all: Totals) => all.weight === 0n ? null : (all.total * 1000n + all.weight / 2n) / all.weight;
export function delta(current: bigint, previous: bigint) {
  if (previous === 0n) return current === 0n ? "ไม่เปลี่ยนแปลง" : "ไม่มีฐานเปรียบเทียบ";
  const difference = current - previous;
  const tenths = ((difference < 0n ? -difference : difference) * 1000n + previous / 2n) / previous;
  const sign = difference > 0n ? "+" : difference < 0n ? "-" : "";
  return `${sign}${(tenths / 10n).toString()}.${tenths % 10n}%`;
}
export function monthRange(month: string) { const [year, monthNumber] = month.split("-").map(Number); const start = `${year.toString().padStart(4, "0")}-${monthNumber.toString().padStart(2, "0")}-01`; const next = new Date(Date.UTC(year, monthNumber, 1)); return { start, end: `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-01` }; }
export function previousMonth(month: string) { const [year, index] = month.split("-").map(Number); const date = new Date(Date.UTC(year, index - 2, 1)); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
export function bangkokMonth() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit" }).format(new Date()).replace("/", "-"); }

export function comparisonAmount(current: bigint, previous: bigint) {
  const difference = current - previous;
  const prefix = difference > 0n ? "+" : "";
  return `${prefix}${money(difference)}`;
}
