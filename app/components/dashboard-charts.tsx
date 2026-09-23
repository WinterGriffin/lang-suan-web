import { money, type Totals } from "@/lib/analytics";
import { thaiDate } from "@/lib/sales";

export type DailyPoint = { sale_date: string; total_amount: number; owner_share: number; worker_share: number; sale_count: number };
export type FarmPoint = { id: string; label: string; total: bigint };

export function SalesTrendChart({ points }: { points: DailyPoint[] }) {
  if (!points.length) return <p className="muted">ยังไม่มีรายการขายในช่วงนี้</p>;
  const values = points.map((point) => Number(point.total_amount));
  const max = Math.max(1, ...values);
  const width = 560;
  const height = 180;
  const step = points.length === 1 ? 0 : width / (points.length - 1);
  const line = points.map((point, index) => `${index * step},${height - Number(point.total_amount) / max * (height - 12)}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  return <div className="trend-wrap"><svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="แนวโน้มยอดขายรายวัน"><polygon points={area} className="trend-area" /><polyline points={line} className="trend-line" /></svg><div className="chart-caption"><span>{thaiDate(points[0].sale_date)}</span><span>{thaiDate(points.at(-1)!.sale_date)}</span></div></div>;
}

export function FarmComparisonChart({ farms }: { farms: FarmPoint[] }) {
  if (!farms.length) return <p className="muted">ยังไม่มีรายการขายในช่วงนี้</p>;
  const max = farms.reduce((result, farm) => farm.total > result ? farm.total : result, 0n);
  return <div className="farm-chart">{farms.map((farm) => <div className="farm-chart-row" key={farm.id}><div><span>{farm.label}</span><b>{money(farm.total)} บาท</b></div><div className="farm-bar-track"><i style={{ width: `${max === 0n ? 0 : Number(farm.total * 10000n / max) / 100}%` }} /></div></div>)}</div>;
}

export function OwnerWorkerChart({ totals }: { totals: Totals }) {
  const total = totals.owner + totals.worker;
  if (total === 0n) return <p className="muted">ยังไม่มีส่วนแบ่งรายได้ในช่วงนี้</p>;
  const owner = Number(totals.owner * 10000n / total) / 100;
  return <div className="share-chart"><div className="share-track" role="img" aria-label={`เจ้าของ ${money(totals.owner)} บาท ลูกจ้าง ${money(totals.worker)} บาท`}><i className="owner-segment" style={{ width: `${owner}%` }} /><i className="worker-segment" style={{ width: `${100 - owner}%` }} /></div><div className="share-legend"><span><i className="owner-dot" />เจ้าของ <b>{money(totals.owner)} บาท</b></span><span><i className="worker-dot" />ลูกจ้าง <b>{money(totals.worker)} บาท</b></span></div><p className="muted">รวม {money(total)} บาท</p></div>;
}
