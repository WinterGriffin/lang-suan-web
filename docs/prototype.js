'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const now = today();
const baseYear = Number(now.slice(0, 4));
const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const fullMonthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

const money = n => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const number = (n, d = 0) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: d }).format(n);
const date = d => displaySaleDate(d);

const sampleReceiptSvg = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 580" width="420" height="580">
  <rect width="420" height="580" fill="#fbfaf6" rx="10" stroke="#d5cfbe" stroke-width="2"/>
  <text x="210" y="45" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#1d3028">ลานเทหลังสวนการเกษตร</text>
  <text x="210" y="68" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#607168">สาขาชุมพร • โทร. 077-542100</text>
  <text x="210" y="90" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#1d513b">ใบชั่งน้ำหนัก / ใบเสร็จรับซื้อผลผลิต</text>
  <line x1="25" y1="108" x2="395" y2="108" stroke="#bbb" stroke-dasharray="5,3"/>
  <text x="35" y="132" font-family="sans-serif" font-size="12" fill="#607168">เลขที่ตั๋วชั่ง: <tspan font-weight="bold" fill="#1d3028">WT-690919-042</tspan></text>
  <text x="385" y="132" font-family="sans-serif" font-size="12" text-anchor="end" fill="#607168">เวลา: 09:42 น.</text>
  <text x="35" y="154" font-family="sans-serif" font-size="12" fill="#607168">ชนิดผลผลิต: <tspan font-weight="bold" fill="#1d3028">ปาล์มน้ำมันทะลายสด (เกรด A)</tspan></text>
  <rect x="30" y="172" width="360" height="150" fill="#ffffff" rx="6" stroke="#e0e5db"/>
  <text x="45" y="198" font-family="sans-serif" font-size="13" fill="#607168">น้ำหนักรวมรถ (Gross)</text>
  <text x="375" y="198" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="end" fill="#1d3028">4,850 kg</text>
  <line x1="45" y1="210" x2="375" y2="210" stroke="#eee"/>
  <text x="45" y="232" font-family="sans-serif" font-size="13" fill="#607168">น้ำหนักรถเปล่า (Tare)</text>
  <text x="375" y="232" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="end" fill="#1d3028">2,400 kg</text>
  <line x1="45" y1="244" x2="375" y2="244" stroke="#eee"/>
  <text x="45" y="268" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1d513b">น้ำหนักสุทธิ (Net Weight)</text>
  <text x="375" y="268" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="end" fill="#1d513b">2,450 kg</text>
  <line x1="45" y1="280" x2="375" y2="280" stroke="#eee"/>
  <text x="45" y="304" font-family="sans-serif" font-size="13" fill="#607168">ราคาต่อหน่วย (Price/kg)</text>
  <text x="375" y="304" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="end" fill="#1d3028">฿6.20</text>
  <rect x="30" y="334" width="360" height="70" fill="#eaf2e8" rx="8"/>
  <text x="50" y="364" font-family="sans-serif" font-size="13" fill="#1d513b">จำนวนเงินสุทธิทั้งสิ้น (Total)</text>
  <text x="50" y="390" font-family="sans-serif" font-size="24" font-weight="bold" fill="#1d513b">฿15,190.00</text>
  <text x="375" y="377" font-family="sans-serif" font-size="11" text-anchor="end" fill="#607168">ชำระแล้ว / เงินโอน</text>
  <line x1="25" y1="420" x2="395" y2="420" stroke="#bbb" stroke-dasharray="5,3"/>
  <text x="90" y="475" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#607168">......................................</text>
  <text x="90" y="495" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#607168">ผู้ชั่งน้ำหนัก / พนักงานลานเท</text>
  <text x="320" y="475" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#607168">......................................</text>
  <text x="320" y="495" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#607168">ผู้ส่งผลผลิต / เกษตรกร</text>
  <rect x="175" y="515" width="70" height="42" rx="4" fill="#e0e8dc" stroke="#b0c0aa"/>
  <text x="210" y="540" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#1d513b">PAID</text>
</svg>
`);

const farms = [
  { id: 'f1', name: 'ปาล์มใหญ่', produce: 'ปาล์มน้ำมัน', mode: 'OWNER', active: true, version: 1 },
  { id: 'f2', name: 'ปาล์มเล็ก', produce: 'ปาล์มน้ำมัน', mode: 'WORKER', active: true, version: 1 },
  { id: 'f3', name: 'สวนมังคุด', produce: 'มังคุด', mode: 'OWNER', active: false, version: 1 }
];

const sales = [];
let serial = 0;
for (let y = baseYear - 1; y <= baseYear; y++) {
  for (let m = 1; m <= 12; m++) {
    for (let f = 0; f < 2; f++) {
      for (let k = 0; k < 3; k++) {
        let d = `${y}-${String(m).padStart(2, '0')}-${String(3 + k * 6 + f).padStart(2, '0')}`;
        if (d > now) continue;
        let w = 950 + f * 320 + m * 70 + k * 170 + (y - baseYear + 1) * 110;
        let p = 5.8 + (m % 4) * 0.25 + f * 0.15;
        let total = Math.round(w * p * 100) / 100;
        let share = Math.round(total * (f ? 0.38 : 0.6) * 100) / 100;
        sales.push({
          id: 's' + (++serial),
          farm: farms[f].id,
          produce: farms[f].produce,
          mode: farms[f].mode,
          date: d,
          weight: w.toFixed(3),
          price: p.toFixed(2),
          share: share.toFixed(2),
          total,
          owner: f ? total - share : share,
          worker: f ? share : total - share,
          version: 1,
          receiptImage: (serial === 1 || serial % 5 === 0) ? sampleReceiptSvg : null,
          history: [{ event: 'สร้างรายการ', at: d + ' 10:30', by: 'ผู้ใช้ตัวอย่าง' }]
        });
      }
    }
  }
}

const state = {
  page: 'dashboard',
  farm: 'all',
  month: now.slice(0, 7),
  year: baseYear,
  report: 'month',
  metric: 'total',
  id: null,
  ui: 'normal',
  currentDraftReceipt: null,
  modal: null,
  drawerOpen: false
};

const farm = id => farms.find(f => f.id === id);
const select = (v, current) => v === current ? 'selected' : '';
const side = m => m === 'OWNER' ? 'เจ้าของ' : 'ลูกจ้าง';

function decimal(s, d) {
  if (!new RegExp('^\\d+(?:\\.\\d{1,' + d + '})?$').test(String(s))) throw Error('ใช้ตัวเลขบวก และทศนิยมไม่เกิน ' + d + ' ตำแหน่ง');
  const [a, b = ''] = String(s).split('.');
  return BigInt(a) * 10n ** BigInt(d) + BigInt(b.padEnd(d, '0'));
}

function calc(w, p, s) {
  let a = decimal(w, 3), b = decimal(p, 2), c = decimal(s, 2);
  if (a <= 0n || a > 9999999999n) throw Error('น้ำหนักต้องมากกว่า 0 และไม่เกิน 9,999,999.999 kg');
  if (b <= 0n || b > 99999999n) throw Error('ราคาต้องมากกว่า 0 และไม่เกิน 999,999.99 บาท');
  let t = (a * b + 500n) / 1000n;
  if (t <= 0n) throw Error('ยอดขายหลังปัดเศษต้องมากกว่า 0');
  if (c > t) throw Error('ส่วนแบ่งต้องไม่เกินยอดขายรวม');
  return { total: Number(t) / 100, share: Number(c) / 100, other: Number(t - c) / 100 };
}

function agg(rows) {
  let total = rows.reduce((s, x) => s + x.total, 0);
  let weight = rows.reduce((s, x) => s + Number(x.weight), 0);
  return { total, weight, average: weight ? total / weight : null, count: rows.length };
}

function filtered(prefix) {
  return sales.filter(s => s.date.startsWith(prefix) && (state.farm === 'all' || s.farm === state.farm));
}

function prevMonth(m) {
  let [y, n] = m.split('-').map(Number);
  return n === 1 ? `${y - 1}-12` : `${y}-${String(n - 1).padStart(2, '0')}`;
}

function monthLabel(m) {
  return fullMonthNames[Number(m.slice(5)) - 1] + ' ' + (Number(m.slice(0, 4)) + 543);
}

function monthShortLabel(m) {
  return monthNames[Number(m.slice(5)) - 1] + ' ' + (Number(m.slice(0, 4)) + 543);
}

function delta(a, b) {
  if (a === null || b === null) return '<span class="stat-delta neutral">ไม่มีฐานเปรียบเทียบ</span>';
  if (b === 0) return `<span class="stat-delta neutral">${a === 0 ? 'ไม่เปลี่ยนแปลง' : 'ไม่มีฐานเปรียบเทียบ'}</span>`;
  let n = (a - b) / b * 100;
  return `<span class="stat-delta ${n < 0 ? 'down' : 'up'}">${n > 0 ? '↑' : n < 0 ? '↓' : '—'} ${number(Math.abs(n), 1)}%</span>`;
}

function availableMonths() {
  const list = [];
  let [curY, curM] = now.split('-').map(Number);
  for (let i = 0; i < 18; i++) {
    const iso = `${curY}-${String(curM).padStart(2, '0')}`;
    list.push({ iso, label: fullMonthNames[curM - 1] + ' ' + (curY + 543) });
    curM--;
    if (curM === 0) { curM = 12; curY--; }
  }
  return list;
}

function options(all = true) {
  return (all ? '<option value="all">ทุกฟาร์มที่มีสิทธิ์</option>' : '') + farms.map(f => `<option value="${f.id}" ${select(f.id, state.farm)}>${esc(f.name)}${f.active ? '' : ' · ปิดใช้งาน'}</option>`).join('');
}

function filters(year = false) {
  return `<div class="filters">
    <label>ฟาร์ม
      <select id="farmFilter">${options()}</select>
    </label>
    ${year ? `<label>ปี
      <select id="yearFilter">${[baseYear, baseYear - 1].map(y => `<option value="${y}" ${select(y, state.year)}>${y + 543}</option>`).join('')}</select>
    </label>` : `<label>เดือน
      <select id="monthFilter">${availableMonths().map(m => `<option value="${m.iso}" ${select(m.iso, state.month)}>${m.label}</option>`).join('')}</select>
    </label>`}
  </div>`;
}

function chart(groups, currentLabel, prevLabel) {
  let max = Math.max(1, ...groups.flatMap(g => [g.a ?? 0, g.b ?? 0]));
  return `<div class="legend">
    <span><i class="dot"></i>${currentLabel}</span>
    <span><i class="dot previous"></i>${prevLabel}</span>
  </div>
  <div class="chart" role="img" aria-label="กราฟเปรียบเทียบ ${esc(currentLabel)} กับ ${esc(prevLabel)}">
    ${groups.map(g => `<div class="bar-col">
      <small>${g.a === null ? '—' : number(g.a, g.a < 100 ? 2 : 0)}</small>
      <div class="bar-area">
        <div class="bar previous" style="height:${Math.max(0, (g.b ?? 0) / max * 100)}%" title="${esc(prevLabel)} ${money(g.b ?? 0)}"></div>
        <div class="bar" style="height:${Math.max(0, (g.a ?? 0) / max * 100)}%" title="${esc(currentLabel)} ${money(g.a ?? 0)}"></div>
      </div>
      <small>${g.label}</small>
    </div>`).join('')}
  </div>`;
}

/* Modern Dashboard Layout */
function dashboard() {
  let a = agg(filtered(state.month)), b = agg(filtered(prevMonth(state.month)));
  let ownerTotal = filtered(state.month).reduce((t, s) => t + s.owner, 0);
  let workerTotal = filtered(state.month).reduce((t, s) => t + s.worker, 0);
  let ownerPct = a.total ? Math.round(ownerTotal / a.total * 100) : 50;
  let workerPct = 100 - ownerPct;

  let groups = farms.filter(f => state.farm === 'all' || f.id === state.farm).map(f => ({
    label: f.name,
    a: agg(filtered(state.month).filter(s => s.farm === f.id)).total,
    b: agg(filtered(prevMonth(state.month)).filter(s => s.farm === f.id)).total
  }));

  const recentRows = filtered(state.month).sort((x, y) => y.date.localeCompare(x.date)).slice(0, 4);

  return `
  <!-- Welcome Bar with Context & Filters -->
  <div class="welcome-card">
    <div class="welcome-info">
      <h1>สวัสดี, คุณผู้ดูแลฟาร์ม 👋</h1>
      <p>ภาพรวมผลการดำเนินงานและการขายผลผลิตประจำเดือน <strong>${monthLabel(state.month)}</strong></p>
    </div>
    <div class="welcome-controls">
      <select id="dashFarmFilter" style="min-height:40px;padding:6px 12px;font-size:13px;border-radius:10px;width:auto;">${options()}</select>
      <select id="dashMonthFilter" style="min-height:40px;padding:6px 12px;font-size:13px;border-radius:10px;width:auto;">${availableMonths().map(m => `<option value="${m.iso}" ${select(m.iso, state.month)}>${m.label}</option>`).join('')}</select>
    </div>
  </div>

  <!-- 4 Stats Cards -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-title">ยอดขายรวม</span>
        <div class="stat-icon revenue">💰</div>
      </div>
      <div class="stat-value">${a.total === null ? '—' : '฿' + money(a.total)}</div>
      <div>${delta(a.total, b.total)}</div>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-title">น้ำหนักรวม</span>
        <div class="stat-icon weight">⚖️</div>
      </div>
      <div class="stat-value">${number(a.weight, 0)}<span class="stat-unit">kg</span></div>
      <div>${delta(a.weight, b.weight)}</div>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-title">ราคาเฉลี่ย / kg</span>
        <div class="stat-icon price">🏷️</div>
      </div>
      <div class="stat-value">${a.average === null ? '—' : '฿' + money(a.average)}</div>
      <div>${delta(a.average, b.average)}</div>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-title">จำนวนครั้งที่ขาย</span>
        <div class="stat-icon count">📋</div>
      </div>
      <div class="stat-value">${a.count}<span class="stat-unit">ครั้ง</span></div>
      <div>${delta(a.count, b.count)}</div>
    </div>
  </div>

  <!-- Main Content: Charts & Income Split -->
  <div class="grid two" style="margin-bottom:24px;">
    <!-- Sales Overview Chart -->
    <section class="panel">
      <div class="row between">
        <h2>ยอดขายแต่ละฟาร์ม</h2>
        <span class="tag">บาท</span>
      </div>
      ${chart(groups, monthShortLabel(state.month), monthShortLabel(prevMonth(state.month)))}
    </section>

    <!-- Income Split & Distribution Donut -->
    <section class="panel">
      <h2>การแบ่งรายได้</h2>
      <p class="muted" style="font-size:12px;margin-bottom:12px;">สัดส่วนยอดขายระหว่างเจ้าของสวนกับคนงาน</p>
      
      <div class="split-card-body">
        <div class="donut-wrap">
          <svg class="donut-svg" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#edf1e7" stroke-width="4"></circle>
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--forest)" stroke-width="4"
                    stroke-dasharray="${ownerPct} ${100 - ownerPct}" stroke-dashoffset="25"></circle>
          </svg>
          <div class="donut-center-text">
            <small>รวมทั้งสิ้น</small>
            <strong>฿${money(a.total)}</strong>
          </div>
        </div>

        <div class="split-legend-list">
          <div class="split-legend-item">
            <div class="split-legend-header">
              <span><i class="split-dot" style="background:var(--forest);"></i>ส่วนของเจ้าของ (${ownerPct}%)</span>
              <strong>฿${money(ownerTotal)}</strong>
            </div>
            <div class="split-bar-meter">
              <div class="split-bar-fill" style="width:${ownerPct}%;background:var(--forest);"></div>
            </div>
          </div>

          <div class="split-legend-item">
            <div class="split-legend-header">
              <span><i class="split-dot" style="background:#829e79;"></i>ส่วนของลูกจ้าง (${workerPct}%)</span>
              <strong>฿${money(workerTotal)}</strong>
            </div>
            <div class="split-bar-meter">
              <div class="split-bar-fill" style="width:${workerPct}%;background:#829e79;"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="notice" style="margin-top:14px;margin-bottom:0;font-size:12px;padding:10px 14px;">
        💡 คำนวณตามกติกาแต่ละสวน: ปาล์มใหญ่ (หักเข้าเจ้าของ) / ปาล์มเล็ก (หักจ่ายคนงาน)
      </div>
    </section>
  </div>

  <!-- Bottom Content: Recent Sales & Quick Actions -->
  <div class="grid two">
    <!-- Recent Sales -->
    <section class="panel">
      <div class="row between">
        <h2>รายการขายล่าสุด</h2>
        <button class="plain-link" data-act="sales">ดูทั้งหมด (${filtered(state.month).length}) →</button>
      </div>
      ${renderSalesList(recentRows)}
    </section>

    <!-- Quick Actions Panel -->
    <section class="panel quick-actions-panel">
      <h2>เมนูด่วน (Quick Actions)</h2>
      <div class="quick-actions-grid">
        <button class="action-tile" data-act="create">
          <div class="action-tile-icon" style="background:var(--green-soft);color:var(--green-icon);">＋</div>
          <div class="action-tile-text">
            <strong>บันทึกการขาย</strong>
            <span>สร้างรายการขายใหม่</span>
          </div>
        </button>

        <button class="action-tile" data-act="reports">
          <div class="action-tile-icon" style="background:var(--blue-soft);color:var(--blue-icon);">📊</div>
          <div class="action-tile-text">
            <strong>รายงานวิเคราะห์</strong>
            <span>ดูยอดรายเดือน/ปี</span>
          </div>
        </button>

        <button class="action-tile" data-act="farms">
          <div class="action-tile-icon" style="background:var(--amber-soft);color:var(--amber-icon);">♧</div>
          <div class="action-tile-text">
            <strong>จัดการฟาร์ม</strong>
            <span>ตั้งค่าสวนและผลผลิต</span>
          </div>
        </button>

        <button class="action-tile" id="btnShareSummary">
          <div class="action-tile-icon" style="background:var(--purple-soft);color:var(--purple-icon);">💬</div>
          <div class="action-tile-text">
            <strong>แชร์สรุปยอด</strong>
            <span>สร้างสลิปส่ง LINE</span>
          </div>
        </button>
      </div>
    </section>
  </div>
  `;
}

function renderSalesList(rows) {
  if (!rows.length) {
    return `<div class="empty">
      <span class="farm-mark" style="margin:auto">↗</span>
      <h2>ยังไม่มีรายการขายในช่วงนี้</h2>
      <p class="muted">เลือกช่วงเวลาอื่น หรือเริ่มบันทึกการขายครั้งแรก</p>
      <button class="primary button" data-act="create" style="margin-top:12px;">+ บันทึกการขาย</button>
    </div>`;
  }

  return `
  <!-- Desktop Table -->
  <div class="desktop-sales table-wrap">
    <table>
      <thead>
        <tr>
          <th>วันที่ขาย</th>
          <th>ฟาร์ม / ผลผลิต</th>
          <th class="num">น้ำหนัก (kg)</th>
          <th class="num">ราคา / kg</th>
          <th class="num">ยอดขาย (บาท)</th>
          <th>ใบเสร็จ</th>
          <th>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(s => `<tr>
          <td>${date(s.date)}</td>
          <td><b>${esc(farm(s.farm).name)}</b><br><small>${esc(s.produce)}</small></td>
          <td class="num">${number(Number(s.weight), 3)}</td>
          <td class="num">฿${money(s.price)}</td>
          <td class="num"><b style="color:var(--forest);">฿${money(s.total)}</b></td>
          <td>${s.receiptImage ? '<span class="tag status-done" style="font-size:10px;">📷 มีใบชั่ง</span>' : '<small class="muted">—</small>'}</td>
          <td><button data-act="detail" data-id="${s.id}" class="button" style="min-height:34px;padding:4px 10px;font-size:12px;">ดูรายการ ↗</button></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- Mobile Touch-friendly Cards -->
  <div class="mobile-sales">
    ${rows.map(s => `
      <div class="sale-card" data-act="detail" data-id="${s.id}">
        <div class="sale-card-top">
          <strong>${esc(farm(s.farm).name)}</strong>
          <span class="sale-card-amount">฿${money(s.total)}</span>
        </div>
        <div class="sale-card-sub">
          <span>${date(s.date)} · ${number(Number(s.weight), 3)} kg × ฿${money(s.price)}</span>
        </div>
        <div class="sale-card-footer">
          <span>${s.receiptImage ? '<span class="tag status-done">📷 แนบใบชั่งแล้ว</span>' : '<span class="tag">' + esc(s.produce) + '</span>'}</span>
          <span style="color:var(--forest);font-weight:600;">ดูรายละเอียด →</span>
        </div>
      </div>
    `).join('')}
  </div>`;
}

function saleList() {
  const rows = filtered(state.month).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const total = agg(rows).total;
  return filters() + `
    <div class="row between" style="margin-bottom:16px">
      <span class="muted">${rows.length} รายการ · ${monthLabel(state.month)}</span>
      <b style="font-size:16px;">รวม ฿${money(total)}</b>
    </div>
    <section class="panel">${renderSalesList(rows)}</section>
  `;
}

/* Create / Edit Form */
function saleForm(edit = false) {
  const s = edit ? sales.find(s => s.id === state.id) : null;
  let f = s ? farm(s.farm) : farms.find(f => f.id === state.farm && f.active) || farms.find(f => f.active);
  if (!f) return '<div class="empty"><h2>ยังไม่มีฟาร์มที่เปิดใช้งาน</h2><button data-act="farms">ไปหน้าฟาร์ม</button></div>';

  if (!edit && state.currentDraftReceipt === undefined) {
    state.currentDraftReceipt = null;
  } else if (edit && state.currentDraftReceipt === null && s?.receiptImage) {
    state.currentDraftReceipt = s.receiptImage;
  }

  return `
  <form id="saleForm" novalidate data-edit="${edit ? 'yes' : 'no'}">
    <div class="form-layout">
      <!-- Left Column: Input Fields -->
      <section class="panel">
        <div class="field-title">
          <span class="step">1</span>
          <h2>ข้อมูลการขาย</h2>
        </div>

        <div class="form-grid">
          <label class="full">ฟาร์ม *
            <select id="saleFarm" ${edit ? 'disabled' : ''}>
              ${farms.filter(x => x.active || x.id === s?.farm).map(x => `<option value="${x.id}" ${select(x.id, f.id)}>${esc(x.name)}</option>`).join('')}
            </select>
            <div class="hint" id="produceHint">${esc(s?.produce || f.produce)} · หน่วย kg</div>
          </label>

          <!-- Date field with Bottom Sheet Modal Picker -->
          <div class="full date-field">
            <label for="saleDateDisplay">วันที่ขาย *</label>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <input id="saleDateDisplay" type="text" readonly value="${displaySaleDate(s?.date || today())}"
                     style="margin:0;cursor:pointer;background:#fff;" placeholder="วว/ดด/ปปปป" required>
              <button id="btnOpenCalendar" type="button" class="button" style="width:50px;flex-shrink:0;font-size:20px;padding:0;" aria-label="เลือกวันที่">📅</button>
            </div>
            <input id="saleDate" type="hidden" value="${s?.date || today()}">
            <div class="hint">แตะเพื่อเลือกวันที่ · สามารถบันทึกย้อนหลังได้</div>
          </div>

          <label>น้ำหนัก (kg) *
            <input id="weight" type="number" step="any" inputmode="decimal" placeholder="เช่น 2450" value="${s?.weight || ''}" required aria-describedby="weightHint">
            <div class="hint" id="weightHint">ทศนิยมได้ 3 ตำแหน่ง · ไม่ใส่ลูกน้ำ</div>
          </label>

          <label>ราคา (บาท / kg) *
            <input id="price" type="number" step="any" inputmode="decimal" placeholder="เช่น 6.20" value="${s?.price || ''}" required>
            <div class="hint">ทศนิยมได้ 2 ตำแหน่ง</div>
          </label>
        </div>

        <hr class="divider">

        <div class="field-title">
          <span class="step">2</span>
          <h2>การแบ่งรายได้</h2>
        </div>

        <label>
          <span id="shareLabel">ส่วนของ${side(s?.mode || f.mode)} (บาท) *</span>
          <input id="share" type="number" step="any" inputmode="decimal" value="${s?.share || ''}" placeholder="เช่น 9000.00" required>
        </label>
        <div class="hint" id="shareHint">กรอกเพียงด้านเดียว อีกด้านจะคำนวณให้อัตโนมัติ</div>

        <!-- Receipt / Slip Attachment Component -->
        <hr class="divider">
        <div class="field-title">
          <span class="step">3</span>
          <h2>แนบรูปใบเสร็จ / ใบชั่งน้ำหนัก</h2>
        </div>
        <p class="hint" style="margin-top:-10px;margin-bottom:14px;">ถ่ายรูปใบชั่งลานเท หรือเลือกรูปจากเครื่อง เพื่อใช้ตรวจทานย้อนหลัง</p>
        
        <input type="file" id="receiptFileInput" accept="image/*" capture="environment" style="display:none;">
        
        <div id="receiptUploadArea">
          ${state.currentDraftReceipt ? `
            <div class="receipt-preview-wrap">
              <img src="${state.currentDraftReceipt}" class="receipt-thumb" id="btnPreviewThumb" alt="รูปใบเสร็จ" title="แตะเพื่อดูรูปใหญ่">
              <div class="receipt-thumb-actions">
                <span class="tag status-done" style="width:fit-content;">✓ แนบรูปภาพแล้ว</span>
                <div class="row" style="gap:8px;">
                  <button type="button" class="button" id="btnChangeReceipt">เปลี่ยนรูป</button>
                  <button type="button" class="button" id="btnRemoveReceipt" style="color:var(--danger);">ลบรูป</button>
                </div>
              </div>
            </div>
          ` : `
            <div class="upload-zone" id="btnTriggerUpload">
              <span class="upload-zone-icon">📷</span>
              <p>แตะเพื่อถ่ายรูป หรือเลือกรูปใบเสร็จ</p>
              <small>รองรับไฟล์รูปภาพ JPG, PNG</small>
            </div>
            <div style="text-align:center;margin-top:10px;">
              <button type="button" class="button" id="btnUseSampleReceipt" style="font-size:12px;padding:6px 14px;min-height:34px;background:#f0f4ec;">
                📎 ทดลองใช้รูปตัวอย่างใบชั่งน้ำหนัก
              </button>
            </div>
          `}
        </div>

        ${edit ? '<div class="notice">รายการนี้ใช้รูปแบบส่วนแบ่งที่เก็บไว้ตอนสร้าง และคงฟาร์มเดิมเพื่อรักษาประวัติ</div>' : ''}
        <div id="formError" role="alert"></div>
      </section>

      <!-- Right Column: Live Summary -->
      <section class="panel summary" aria-live="polite">
        <div class="eyebrow">สรุปรายการคำนวณสด</div>
        <h2>ยอดขายรวม</h2>
        <div class="total" id="total">฿${s ? money(s.total) : '0.00'}</div>
        <p class="muted" id="equation">น้ำหนัก × ราคาต่อกิโลกรัม</p>

        <hr class="divider">

        <div class="row between">
          <span id="otherLabel">ส่วนของ${side((s?.mode || f.mode) === 'OWNER' ? 'WORKER' : 'OWNER')}</span>
          <b id="other" style="font-size:18px;">฿${s ? money(s.mode === 'OWNER' ? s.worker : s.owner) : '0.00'}</b>
        </div>
        <div class="hint">คำนวณให้อัตโนมัติ (ยอดรวม − ส่วนที่กรอก)</div>
        <div class="check" id="sumCheck">กรอกข้อมูลเพื่อคำนวณยอด</div>
        <p class="hint" style="margin-top:18px;">ยอดรวมปัดเป็นสตางค์ก่อนแบ่งรายได้</p>
      </section>
    </div>

    <!-- Mobile-optimized Full Width Save Bar -->
    <div class="savebar">
      <button type="button" class="button" data-act="cancel">ยกเลิก</button>
      <button type="submit" class="primary button">${edit ? 'บันทึกการแก้ไข' : 'บันทึกการขาย'} →</button>
    </div>
  </form>
  `;
}

/* Sale Detail */
function detail() {
  let s = sales.find(x => x.id === state.id);
  if (!s) return '<div class="empty"><h2>ไม่พบข้อมูลรายการ</h2><button data-act="sales">กลับรายการขาย</button></div>';

  return `
  <div class="grid two">
    <section class="panel">
      <div class="row between">
        <span class="tag">บันทึกแล้ว · เวอร์ชัน ${s.version}</span>
        <small style="font-weight:600;color:var(--muted);">SALE-${s.id.slice(1).padStart(4, '0')}</small>
      </div>

      <h2 style="margin-top:18px;margin-bottom:4px;">${esc(farm(s.farm).name)}</h2>
      <div class="stat-value" style="font-size:32px;color:var(--forest);margin-bottom:4px;">฿${money(s.total)}</div>
      <p class="muted">${date(s.date)} · ${esc(s.produce)}</p>

      <hr class="divider">

      <div class="detail-grid">
        ${[
          ['น้ำหนักสุทธิ', number(Number(s.weight), 3) + ' kg'],
          ['ราคาต่อกิโลกรัม', '฿' + money(s.price)],
          ['ส่วนของเจ้าของ', '฿' + money(s.owner)],
          ['ส่วนของลูกจ้าง', '฿' + money(s.worker)]
        ].map(([a, b]) => `<div class="detail-item"><span>${a}</span><strong>${b}</strong></div>`).join('')}
      </div>

      <div class="check" style="margin-top:18px;">✓ ส่วนแบ่งรวมตรงกับยอดขาย ฿${money(s.total)}</div>
      <p class="hint">กรอกส่วนของ${side(s.mode)} · อีกด้านคำนวณอัตโนมัติ</p>

      <!-- Attached Receipt Card -->
      <div class="receipt-box" style="margin-top:20px;">
        <h3>รูปใบเสร็จ / ใบชั่งน้ำหนัก</h3>
        ${s.receiptImage ? `
          <div class="receipt-preview-wrap">
            <img src="${s.receiptImage}" class="receipt-thumb" id="btnOpenReceiptLightbox" alt="ใบเสร็จ">
            <div class="receipt-thumb-actions">
              <strong>แนบใบชั่งน้ำหนักแล้ว</strong>
              <small class="muted">แตะที่รูปเพื่อดูขนาดเต็ม</small>
              <button type="button" class="button" id="btnViewFullReceipt" style="width:fit-content;">🔍 ดูรูปขนาดเต็ม</button>
            </div>
          </div>
        ` : `
          <div class="notice" style="margin:10px 0;">ไม่มีรูปใบเสร็จแนบในรายการนี้ สามารถกดแก้ไขเพื่อถ่ายรูปแนบได้</div>
        `}
      </div>

      <!-- Action Buttons: Edit & Share LINE Slip -->
      <div class="row" style="margin-top:24px;gap:12px;">
        <button class="button" data-act="edit" data-id="${s.id}" style="flex:1;">✏️ แก้ไขรายการ</button>
        <button class="primary button" id="btnOpenLineSlip" style="flex:1.2;">💬 แชร์สลิปส่ง LINE</button>
      </div>
    </section>

    <!-- Audit Log -->
    <section class="panel">
      <h2>ประวัติการเปลี่ยนแปลง</h2>
      <p class="hint">บันทึก Audit Log โปร่งใส ตรวจสอบได้</p>
      <ol class="audit">
        ${[...s.history].reverse().map(h => `
          <li>
            <strong>${h.event}</strong>
            <p class="hint" style="margin-bottom:0">${h.at} · ${h.by}</p>
            ${h.note ? `<p class="hint" style="color:var(--forest);font-weight:500;">${esc(h.note)}</p>` : ''}
          </li>
        `).join('')}
      </ol>
    </section>
  </div>
  `;
}

function farmList() {
  return `
  <p class="muted">กำหนดผลผลิตและกติกาการกรอกส่วนแบ่งให้แต่ละฟาร์ม</p>
  <div class="farmcards">
    ${farms.map(f => {
      let a = agg(sales.filter(s => s.farm === f.id && s.date.startsWith(now.slice(0, 7))));
      return `
      <section class="panel">
        <div class="row between">
          <div class="farm-mark">♧</div>
          <span class="tag">${f.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
        </div>
        <h2>${esc(f.name)}</h2>
        <p class="muted">${esc(f.produce)} · kg</p>
        <div style="margin:16px 0;">
          <small class="muted">ยอดขายเดือนนี้</small>
          <div class="stat-value" style="font-size:24px;">฿${money(a.total)}</div>
        </div>
        <p class="hint">กติกา: กรอกส่วนของ${side(f.mode)}</p>
        <button class="button" data-act="farmDetail" data-id="${f.id}">ดูฟาร์มและการตั้งค่า →</button>
      </section>`;
    }).join('')}
  </div>`;
}

function farmDetail() {
  const f = farm(state.id);
  return `
  <div class="grid two">
    <form id="farmForm" class="panel">
      <h2>ข้อมูลและการตั้งค่าฟาร์ม</h2>
      <div class="form-grid">
        <label class="full">ชื่อฟาร์ม *
          <input id="farmName" value="${esc(f.name)}" maxlength="120" required>
        </label>
        <label class="full">ผลผลิต *
          <input id="farmProduce" value="${esc(f.produce)}" maxlength="120" required>
          <div class="hint">ระบุผลผลิตที่ฟาร์มนี้ขาย เช่น ปาล์มน้ำมัน</div>
        </label>
        <label class="full">ด้านที่กรอกส่วนแบ่ง
          <select id="farmMode">
            <option value="OWNER" ${select(f.mode, 'OWNER')}>ส่วนของเจ้าของ</option>
            <option value="WORKER" ${select(f.mode, 'WORKER')}>ส่วนของลูกจ้าง</option>
          </select>
        </label>
        <label class="full">สถานะ
          <select id="farmActive">
            <option value="yes" ${f.active ? 'selected' : ''}>เปิดใช้งาน</option>
            <option value="no" ${f.active ? '' : 'selected'}>ปิดใช้งาน</option>
          </select>
        </label>
      </div>
      <div class="notice">การเปลี่ยนผลผลิตหรือด้านที่กรอก มีผลกับรายการใหม่เท่านั้น รายการเก่าจะคงข้อมูลเดิม</div>
      <button type="submit" class="primary button" style="width:100%;">บันทึกข้อมูลฟาร์ม</button>
    </form>

    <section class="panel">
      <h2>รายการขายของฟาร์ม</h2>
      <p class="hint">5 รายการล่าสุด</p>
      ${renderSalesList(sales.filter(s => s.farm === f.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5))}
    </section>
  </div>`;
}

/* Reports with Mobile Adaptive View */
function reports() {
  const key = state.metric;
  const unit = key === 'weight' ? 'kg' : key === 'count' ? 'ครั้ง' : 'บาท';
  const fmt = v => v === null ? '—' : key === 'count' ? number(v) : money(v);
  const yearRows = y => sales.filter(s => s.date.startsWith(String(y)) && (state.farm === 'all' || s.farm === state.farm));

  let groups = state.report === 'farm'
    ? farms.filter(f => state.farm === 'all' || state.farm === f.id).map(f => ({
        label: f.name,
        a: agg(yearRows(state.year).filter(s => s.farm === f.id))[key],
        b: agg(yearRows(state.year - 1).filter(s => s.farm === f.id))[key]
      }))
    : state.report === 'year'
    ? [{ label: 'รวมทั้งปี', a: agg(yearRows(state.year))[key], b: agg(yearRows(state.year - 1))[key] }]
    : monthNames.map((m, i) => ({
        label: m,
        future: state.year === baseYear && i + 1 > Number(now.slice(5, 7)),
        a: state.year === baseYear && i + 1 > Number(now.slice(5, 7)) ? null : agg(yearRows(state.year).filter(s => Number(s.date.slice(5, 7)) === i + 1))[key],
        b: agg(yearRows(state.year - 1).filter(s => Number(s.date.slice(5, 7)) === i + 1))[key]
      }));

  let a = agg(yearRows(state.year)), b = agg(yearRows(state.year - 1));

  return `
  <div class="tabs" role="group" aria-label="รูปแบบรายงาน">
    ${[['month', 'รายเดือน'], ['year', 'เทียบรายปี'], ['farm', 'เทียบฟาร์ม']].map(([v, l]) => `
      <button data-act="reportTab" data-id="${v}" class="${state.report === v ? 'selected' : ''}">${l}</button>
    `).join('')}
  </div>

  ${filters(true)}

  <p class="hint">ปี ${state.year + 543} เทียบ ${state.year + 542} · ปีปัจจุบันเป็นยอดสะสมถึงวันนี้ เทียบปีก่อนเต็มปี</p>

  <div class="stats-grid" style="margin-bottom:24px;">
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-title">ยอดขายปีนี้</span>
        <div class="stat-icon revenue">💰</div>
      </div>
      <div class="stat-value">฿${money(a.total)}</div>
      <div>${delta(a.total, b.total)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-title">น้ำหนักรวม</span>
        <div class="stat-icon weight">⚖️</div>
      </div>
      <div class="stat-value">${number(a.weight, 0)}<span class="stat-unit">kg</span></div>
      <div>${delta(a.weight, b.weight)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-title">ราคาเฉลี่ย / kg</span>
        <div class="stat-icon price">🏷️</div>
      </div>
      <div class="stat-value">${a.average === null ? '—' : '฿' + money(a.average)}</div>
      <div>${delta(a.average, b.average)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-title">จำนวนครั้งที่ขาย</span>
        <div class="stat-icon count">📋</div>
      </div>
      <div class="stat-value">${a.count}<span class="stat-unit">ครั้ง</span></div>
      <div>${delta(a.count, b.count)}</div>
    </div>
  </div>

  <section class="panel">
    <div class="row between" style="margin-bottom:14px;">
      <h2>${state.report === 'month' ? 'ยอดแยกรายเดือน' : state.report === 'farm' ? 'เปรียบเทียบแต่ละฟาร์ม' : 'ผลประกอบการรายปี'}</h2>
      <label style="font-size:12px;min-width:140px;">ตัวชี้วัด
        <select id="metric" style="min-height:38px;padding:6px 10px;font-size:13px;border-radius:8px;">
          <option value="total" ${select(key, 'total')}>ยอดขาย (บาท)</option>
          <option value="weight" ${select(key, 'weight')}>น้ำหนักรวม (kg)</option>
          <option value="average" ${select(key, 'average')}>ราคาเฉลี่ย / kg</option>
          <option value="count" ${select(key, 'count')}>จำนวนครั้งที่ขาย</option>
        </select>
      </label>
    </div>

    ${chart(groups.length > 6 && innerWidth < 768 ? groups.slice(0, 6) : groups, String(state.year + 543), String(state.year + 542))}
    ${groups.length > 6 && innerWidth < 768 ? '<p class="hint" style="text-align:center;">กราฟแสดง ม.ค.–มิ.ย. • ดูข้อมูลครบ 12 เดือนในการ์ดด้านล่าง</p>' : ''}

    <!-- Desktop Table View -->
    <div class="desktop-reports-table table-wrap" style="margin-top:20px;">
      <table>
        <thead>
          <tr>
            <th>${state.report === 'farm' ? 'ฟาร์ม' : 'ช่วงเวลา'}</th>
            <th class="num">ปี ${state.year + 543}</th>
            <th class="num">ปี ${state.year + 542}</th>
            <th class="num">เปลี่ยนแปลง</th>
          </tr>
        </thead>
        <tbody>
          ${groups.map(g => `<tr>
            <td><b>${esc(g.label)}</b></td>
            <td class="num">${fmt(g.a)}</td>
            <td class="num">${fmt(g.b)}</td>
            <td class="num">${g.future ? '<small class="muted">ยังไม่ถึงช่วง</small>' : delta(g.a, g.b)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- Mobile Adaptive Cards View -->
    <div class="mobile-reports-cards">
      ${groups.map(g => `
        <div class="report-card-item">
          <div>
            <div class="report-card-label">${esc(g.label)}</div>
            <div class="report-card-sub">ปีก่อน (${state.year + 542}): ${fmt(g.b)} ${unit}</div>
          </div>
          <div class="report-card-values">
            <div class="report-card-val">${fmt(g.a)} <small style="font-weight:400;color:var(--muted);">${unit}</small></div>
            <div>${g.future ? '<small class="muted">ยังไม่ถึงช่วง</small>' : delta(g.a, g.b)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  </section>
  `;
}

const navItems = [
  ['dashboard', '◫', 'ภาพรวม'],
  ['sales', '↗', 'การขาย'],
  ['farms', '♧', 'ฟาร์ม'],
  ['reports', '▥', 'รายงาน']
];

function navigation() {
  return navItems.map(([v, i, l]) => `
    <button data-act="${v}" class="${state.page === v || (v === 'sales' && ['create', 'edit', 'detail'].includes(state.page)) || (v === 'farms' && state.page === 'farmDetail') ? 'active' : ''}">
      <span class="navsymbol" aria-hidden="true">${i}</span>
      <span>${l}</span>
    </button>
  `).join('');
}

function render() {
  const titles = {
    dashboard: ['ภาพรวมการขาย', 'ทุกตัวเลขสำคัญจากฟาร์มของคุณ'],
    sales: ['รายการขาย', 'ติดตามและตรวจสอบการขายผลผลิต'],
    create: ['บันทึกการขาย', 'กรอกง่าย คำนวณให้อัตโนมัติ พร้อมแนบรูปใบชั่ง'],
    edit: ['แก้ไขรายการขาย', 'การเปลี่ยนแปลงจะถูกเก็บในประวัติการแก้ไข'],
    detail: ['รายละเอียดการขาย', 'ตรวจสอบยอดขาย ส่วนแบ่งรายได้ และรูปใบเสร็จ'],
    farms: ['ฟาร์มของคุณ', 'ข้อมูลผลผลิตและกติกาการแบ่งรายได้'],
    farmDetail: ['รายละเอียดฟาร์ม', 'ตั้งค่าครั้งเดียว ใช้กับทุกการขายใหม่'],
    reports: ['รายงานการขาย', 'เปรียบเทียบผลลัพธ์เพื่อวางแผนรอบถัดไป']
  };

  const title = titles[state.page];
  const isSubpage = ['create', 'edit', 'detail', 'farmDetail'].includes(state.page);

  let content = '';
  if (state.page === 'dashboard') content = dashboard();
  else if (state.page === 'sales') content = saleList();
  else if (state.page === 'create') content = saleForm();
  else if (state.page === 'edit') content = saleForm(true);
  else if (state.page === 'detail') content = detail();
  else if (state.page === 'farms') content = farmList();
  else if (state.page === 'farmDetail') content = farmDetail();
  else content = reports();

  if (state.ui === 'loading') {
    content = '<div class="stats-grid">' + Array(4).fill('<div class="stat-card" style="height:120px;background:#eef2ea;"></div>').join('') + '</div><p class="hint" role="status">กำลังโหลดข้อมูล…</p>';
  } else if (state.ui === 'error') {
    content = '<section class="panel empty"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p class="muted">ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง</p><button data-act="retry" class="primary button">ลองอีกครั้ง</button></section>';
  } else if (state.ui === 'empty') {
    content = '<section class="panel">' + renderSalesList([]) + '</section>';
  } else if (state.ui === 'denied') {
    content = '<section class="panel empty"><h2>คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้</h2><p class="muted">ติดต่อผู้ดูแลฟาร์มเพื่อขอสิทธิ์</p><button data-act="dashboard" class="button">กลับภาพรวม</button></section>';
  }

  $('#app').innerHTML = `
  <!-- Mobile Sticky Top Bar with Hamburger -->
  <header class="mobile-top-bar">
    <button type="button" class="hamburger-btn" id="btnHamburger" aria-label="เปิดเมนู">☰</button>
    <div class="mobile-top-brand"><em>ล</em>หลังสวน</div>
    ${state.page !== 'create' ? '<button type="button" class="primary button" data-act="create" style="min-height:36px;padding:4px 12px;font-size:12px;border-radius:10px;">＋ เพิ่มรายการ</button>' : '<span></span>'}
  </header>

  <!-- Slide-over Drawer Menu for Mobile -->
  <div class="drawer-overlay ${state.drawerOpen ? 'open' : ''}" id="drawerOverlay">
    <div class="drawer-panel" id="drawerPanel">
      <div class="drawer-header">
        <div class="brand"><em>ล</em>หลังสวน</div>
        <button type="button" class="modal-close" id="btnCloseDrawer" aria-label="ปิดเมนู">✕</button>
      </div>
      <nav class="drawer-nav">
        <button data-act="dashboard" class="${state.page === 'dashboard' ? 'active' : ''}">
          <span class="navsymbol">◫</span> ภาพรวมการขาย
        </button>
        <button data-act="sales" class="${['sales', 'create', 'edit', 'detail'].includes(state.page) ? 'active' : ''}">
          <span class="navsymbol">↗</span> รายการขาย
        </button>
        <button data-act="farms" class="${['farms', 'farmDetail'].includes(state.page) ? 'active' : ''}">
          <span class="navsymbol">♧</span> ฟาร์มของคุณ
        </button>
        <button data-act="reports" class="${state.page === 'reports' ? 'active' : ''}">
          <span class="navsymbol">▥</span> รายงานการขาย
        </button>
        
        <div style="border-top:1px solid var(--line);margin:10px 0;"></div>
        
        <button data-act="create" class="drawer-add">
          <span class="navsymbol">＋</span> บันทึกการขายใหม่
        </button>
      </nav>
      <div class="drawer-footer">
        <span class="avatar">ส</span>
        <div>
          <strong>ผู้ใช้ตัวอย่าง</strong><br>
          <small class="muted">ผู้ดูแลฟาร์ม</small>
        </div>
      </div>
    </div>
  </div>

  <div class="shell">
    <aside>
      <div>
        <div class="brand"><em>ล</em>หลังสวน</div>
        <div class="brand-sub">ระบบบันทึกยอดขายผลผลิตเกษตร</div>
      </div>
      <nav aria-label="เมนูหลัก">${navigation()}</nav>
      <div class="aside-bottom">
        <span class="avatar">ส</span>
        <div>
          <strong>ผู้ใช้ตัวอย่าง</strong><br>
          <small class="muted">ผู้ดูแลฟาร์ม</small>
        </div>
      </div>
    </aside>

    <main class="main">
      <div class="eyebrow">LANG SUAN / ${state.page.toUpperCase()}</div>
      
      ${isSubpage ? '<button class="button" data-act="back" style="margin-bottom:14px;min-height:36px;padding:4px 12px;font-size:13px;">← ย้อนกลับ</button>' : ''}
      
      <header class="topline">
        <div>
          <h1>${title[0]}</h1>
          <p>${title[1]}</p>
        </div>
        ${['dashboard', 'sales'].includes(state.page) ? '<button class="primary button" data-act="create">＋ บันทึกการขาย</button>' : ''}
      </header>

      ${content}

      <div style="border-top:1px solid var(--line);margin-top:40px;padding-top:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:12px;color:var(--muted);">
        <div>
          <span>สถานะทดสอบ: </span>
          <select id="uiState" style="width:auto;min-height:32px;padding:2px 8px;font-size:12px;margin:0;">
            ${[['normal', 'ปกติ'], ['loading', 'กำลังโหลด'], ['empty', 'ไม่มีข้อมูล'], ['error', 'เชื่อมต่อล้มเหลว'], ['denied', 'ไม่มีสิทธิ์']].map(([v, t]) => `<option value="${v}" ${select(v, state.ui)}>${t}</option>`).join('')}
          </select>
        </div>
        <a href="index.html">เอกสารส่งต่อและคู่มือ ↗</a>
      </div>
    </main>
  </div>
  `;

  renderModals();
  wire();
}

function toast(text) {
  const t = $('#toast');
  t.textContent = text;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3200);
}

function closeModal() {
  state.modal = null;
  renderModals();
}

function navigate(page, id) {
  state.page = page;
  if (id !== undefined) state.id = id;
  state.ui = 'normal';
  state.drawerOpen = false;
  if (page === 'create') state.currentDraftReceipt = null;
  render();
  window.scrollTo(0, 0);
}

function updateCalc(showError = false) {
  let s = state.page === 'edit' ? sales.find(x => x.id === state.id) : null;
  let f = farm($('#saleFarm').value);
  let mode = s?.mode || f.mode;

  $('#shareLabel').textContent = `ส่วนของ${side(mode)} (บาท) *`;
  $('#otherLabel').textContent = 'ส่วนของ' + side(mode === 'OWNER' ? 'WORKER' : 'OWNER');
  $('#produceHint').textContent = (s?.produce || f.produce) + ' · หน่วย kg';

  try {
    let c = calc($('#weight').value, $('#price').value, $('#share').value);
    $('#total').textContent = '฿' + money(c.total);
    $('#other').textContent = '฿' + money(c.other);
    $('#equation').textContent = `${number(Number($('#weight').value), 3)} kg × ฿${money($('#price').value)}`;
    $('#sumCheck').textContent = '✓ ส่วนแบ่งรวม ฿' + money(c.total);
    $('#formError').innerHTML = '';
    return c;
  } catch (e) {
    try {
      const c = calc($('#weight').value, $('#price').value, '0');
      $('#total').textContent = '฿' + money(c.total);
    } catch {
      $('#total').textContent = '฿0.00';
    }
    $('#other').textContent = '—';
    $('#sumCheck').textContent = 'กรอกข้อมูลให้ครบและตรวจสอบส่วนแบ่ง';
    if (showError) $('#formError').innerHTML = `<div class="error">${esc(e.message)}</div>`;
    return null;
  }
}

/* Modals Rendering & Direct Event Wiring */
function renderModals() {
  const container = $('#modalContainer');
  if (!container) return;

  if (!state.modal) {
    container.innerHTML = '';
    return;
  }

  if (state.modal.type === 'calendar') {
    container.innerHTML = `
    <div class="modal-overlay" id="modalBackdrop">
      <div class="modal-card">
        <div class="sheet-handle"></div>
        <div class="modal-header">
          <h3>เลือกวันที่ขาย</h3>
          <button type="button" class="modal-close" id="btnCloseModal">✕</button>
        </div>

        <div class="quick-chips">
          <button type="button" class="chip-btn" data-chip="today">วันนี้ (${displaySaleDate(today()).slice(0, 5)})</button>
          <button type="button" class="chip-btn" data-chip="yesterday">เมื่อวาน</button>
          <button type="button" class="chip-btn" data-chip="prev2">ย้อนหลัง 2 วัน</button>
        </div>

        <div id="modalCalendarView"></div>

        <button type="button" class="primary button" id="btnConfirmDate" style="width:100%;margin-top:16px;">ตกลง</button>
      </div>
    </div>`;
    drawModalCalendar();
  } else if (state.modal.type === 'receiptLightbox') {
    container.innerHTML = `
    <div class="modal-overlay" id="modalBackdrop">
      <div class="modal-card" style="text-align:center;max-width:480px;">
        <div class="modal-header">
          <h3>รูปใบเสร็จ / ใบชั่งน้ำหนัก</h3>
          <button type="button" class="modal-close" id="btnCloseModal" aria-label="ปิด">✕</button>
        </div>
        <img src="${state.modal.data}" class="lightbox-img" alt="ใบชั่งน้ำหนักขยายใหญ่">
        <button type="button" class="button" id="btnCloseModal2" style="width:100%;min-height:46px;font-size:15px;background:#f0f3ed;">ปิดหน้าต่าง</button>
      </div>
    </div>`;
  } else if (state.modal.type === 'lineSlip') {
    const s = state.modal.data;
    container.innerHTML = `
    <div class="modal-overlay" id="modalBackdrop">
      <div class="modal-card" style="max-width:400px;">
        <div class="sheet-handle"></div>
        <div class="modal-header">
          <h3>สลิปสรุปยอดสำหรับส่ง LINE</h3>
          <button type="button" class="modal-close" id="btnCloseModal">✕</button>
        </div>

        <div class="line-slip-card" id="lineSlipCaptureArea">
          <div class="slip-top">
            <div class="slip-brand">หลังสวน (LANG SUAN)</div>
            <div class="slip-meta">สลิปสรุปรายการขายผลผลิต • ${date(s.date)}</div>
          </div>

          <div class="slip-row">
            <span class="muted">ฟาร์ม / แปลง</span>
            <strong>${esc(farm(s.farm)?.name || 'รวมทุกฟาร์ม')}</strong>
          </div>
          <div class="slip-row">
            <span class="muted">ผลผลิต</span>
            <span>${esc(s.produce)}</span>
          </div>
          <div class="slip-row">
            <span class="muted">น้ำหนักสุทธิ</span>
            <strong>${number(Number(s.weight), 3)} kg</strong>
          </div>
          <div class="slip-row">
            <span class="muted">ราคาต่อกิโลกรัม</span>
            <span>฿${money(s.price)}</span>
          </div>

          <div class="slip-row big">
            <span>ยอดขายรวมสุทธิ</span>
            <span>฿${money(s.total)}</span>
          </div>

          <div class="slip-share-box">
            <div style="font-weight:600;font-size:12px;color:var(--forest);margin-bottom:6px;">การแบ่งรายได้ตามข้อตกลง:</div>
            <div class="slip-row" style="padding:2px 0;">
              <span>ส่วนของเจ้าของสวน:</span>
              <strong style="color:var(--forest);">฿${money(s.owner)}</strong>
            </div>
            <div class="slip-row" style="padding:2px 0;">
              <span>ส่วนของลูกจ้าง / คนงาน:</span>
              <strong>฿${money(s.worker)}</strong>
            </div>
          </div>

          <div style="text-align:center;font-size:10px;color:var(--muted);margin-top:14px;">
            บันทึกผ่านระบบหลังสวน • ตรวจสอบความถูกต้องแล้ว
          </div>
        </div>

        <div class="slip-actions">
          <button type="button" class="button" id="btnCopyLineText">📋 คัดลอกข้อความ</button>
          <button type="button" class="primary button" id="btnDoneLineSlip">เรียบร้อย</button>
        </div>
      </div>
    </div>`;
  }

  // Bind modal event listeners immediately whenever rendered!
  if ($('#btnCloseModal')) $('#btnCloseModal').onclick = closeModal;
  if ($('#btnCloseModal2')) $('#btnCloseModal2').onclick = closeModal;
  if ($('#btnDoneLineSlip')) {
    $('#btnDoneLineSlip').onclick = () => { closeModal(); toast('บันทึกรูปหรือแชร์ข้อมูลแล้ว'); };
  }
  if ($('#modalBackdrop')) {
    $('#modalBackdrop').onclick = e => {
      if (e.target.id === 'modalBackdrop') closeModal();
    };
  }
  if ($('#btnCopyLineText')) {
    $('#btnCopyLineText').onclick = () => {
      const s = state.modal.data;
      const text = `🌿 หลังสวน: สรุปยอดขาย\nฟาร์ม: ${farm(s.farm)?.name || 'รวม'}\nวันที่: ${date(s.date)}\nน้ำหนัก: ${number(Number(s.weight), 3)} kg\nยอดรวม: ฿${money(s.total)}\n- เจ้าของ: ฿${money(s.owner)}\n- คนงาน: ฿${money(s.worker)}`;
      navigator.clipboard?.writeText(text);
      toast('คัดลอกข้อความสรุปสำหรับส่ง LINE แล้ว');
    };
  }
  if ($('#btnConfirmDate')) {
    $('#btnConfirmDate').onclick = () => {
      $('#saleDate').value = calSelectedDate;
      $('#saleDateDisplay').value = displaySaleDate(calSelectedDate);
      closeModal();
    };
  }
  if ($('.quick-chips')) {
    $$('.chip-btn').forEach(btn => {
      btn.onclick = () => {
        const type = btn.dataset.chip;
        const nowDt = new Date();
        if (type === 'yesterday') nowDt.setDate(nowDt.getDate() - 1);
        else if (type === 'prev2') nowDt.setDate(nowDt.getDate() - 2);
        const y = nowDt.getFullYear(), m = String(nowDt.getMonth() + 1).padStart(2, '0'), d = String(nowDt.getDate()).padStart(2, '0');
        calSelectedDate = `${y}-${m}-${d}`;
        calYear = y;
        calMonth = nowDt.getMonth();
        drawModalCalendar();
      };
    });
  }
}

/* Modal Calendar Internal State & Logic */
let calYear = baseYear;
let calMonth = Number(now.slice(5, 7)) - 1;
let calSelectedDate = now;

function drawModalCalendar() {
  const panel = $('#modalCalendarView');
  if (!panel) return;

  const limit = today();
  const [maxYear, maxMonth] = limit.split('-').map(Number);
  const first = utcDay(calYear, calMonth, 1).getUTCDay();
  const count = utcDay(calYear, calMonth + 1, 0).getUTCDate();

  panel.innerHTML = `
  <div class="calendar-grid">
    <div class="calendar-nav">
      <button type="button" id="calPrev" class="button" style="min-height:36px;padding:4px 10px;">‹</button>
      <select id="calMonthSelect" style="flex:1;">
        ${fullMonthNames.map((m, i) => `<option value="${i}" ${i === calMonth ? 'selected' : ''}>${m}</option>`).join('')}
      </select>
      <select id="calYearSelect" style="width:90px;">
        ${[baseYear, baseYear - 1, baseYear - 2].map(y => `<option value="${y}" ${y === calYear ? 'selected' : ''}>${y + 543}</option>`).join('')}
      </select>
      <button type="button" id="calNext" class="button" style="min-height:36px;padding:4px 10px;" ${calYear === maxYear && calMonth === maxMonth - 1 ? 'disabled' : ''}>›</button>
    </div>

    <div class="calendar-week-days">
      ${['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => `<span>${d}</span>`).join('')}
    </div>

    <div class="calendar-cells">
      ${Array(first).fill('<span></span>').join('')}
      ${Array.from({ length: count }, (_, i) => {
        const d = i + 1;
        const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isSelected = key === calSelectedDate;
        const isToday = key === limit;
        const isFuture = key > limit;
        return `<button type="button" data-date="${key}" class="${isSelected ? 'selected' : ''} ${isToday ? 'today-cell' : ''}" ${isFuture ? 'disabled' : ''}>${d}</button>`;
      }).join('')}
    </div>
  </div>`;

  $('#calPrev').onclick = () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    drawModalCalendar();
  };
  $('#calNext').onclick = () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    drawModalCalendar();
  };
  $('#calMonthSelect').onchange = e => { calMonth = Number(e.target.value); drawModalCalendar(); };
  $('#calYearSelect').onchange = e => { calYear = Number(e.target.value); drawModalCalendar(); };

  panel.querySelectorAll('[data-date]').forEach(b => {
    b.onclick = () => {
      calSelectedDate = b.dataset.date;
      drawModalCalendar();
    };
  });
}

function displaySaleDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${String(Number(y) + 543).padStart(4, '0')}`;
}

function utcDay(y, m, d) {
  const value = new Date(0);
  value.setUTCFullYear(y, m, d);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

function wire() {
  // Navigation actions
  $$('[data-act]').forEach(b => {
    b.onclick = () => {
      let a = b.dataset.act, id = b.dataset.id;
      if (['create', 'dashboard', 'sales', 'farms', 'reports', 'detail', 'edit', 'farmDetail'].includes(a)) {
        if (['create', 'edit'].includes(state.page) && !confirm('ออกจากหน้านี้? ข้อมูลที่ยังไม่บันทึกจะหายไป')) return;
        navigate(a, id);
      } else if (a === 'back' || a === 'cancel') {
        if (['create', 'edit'].includes(state.page) && !confirm('ยกเลิกการกรอกข้อมูลที่ยังไม่บันทึก?')) return;
        navigate(state.page === 'farmDetail' ? 'farms' : 'sales');
      } else if (a === 'reportTab') {
        state.report = id;
        render();
      } else if (a === 'retry') {
        state.ui = 'normal';
        render();
      }
    };
  });

  // Hamburger & Drawer wiring
  const drawerOverlay = $('#drawerOverlay');
  if ($('#btnHamburger')) {
    $('#btnHamburger').onclick = () => {
      state.drawerOpen = true;
      if (drawerOverlay) drawerOverlay.classList.add('open');
    };
  }
  if ($('#btnCloseDrawer')) {
    $('#btnCloseDrawer').onclick = () => {
      state.drawerOpen = false;
      if (drawerOverlay) drawerOverlay.classList.remove('open');
    };
  }
  if (drawerOverlay) {
    drawerOverlay.onclick = e => {
      if (e.target.id === 'drawerOverlay') {
        state.drawerOpen = false;
        drawerOverlay.classList.remove('open');
      }
    };
  }

  // Filters change
  if ($('#dashFarmFilter')) $('#dashFarmFilter').onchange = e => { state.farm = e.target.value; render(); };
  if ($('#dashMonthFilter')) $('#dashMonthFilter').onchange = e => { state.month = e.target.value; render(); };
  if ($('#farmFilter')) $('#farmFilter').onchange = e => { state.farm = e.target.value; render(); };
  if ($('#monthFilter')) $('#monthFilter').onchange = e => { state.month = e.target.value; render(); };
  if ($('#yearFilter')) $('#yearFilter').onchange = e => { state.year = Number(e.target.value); render(); };
  if ($('#metric')) $('#metric').onchange = e => { state.metric = e.target.value; render(); };
  if ($('#uiState')) $('#uiState').onchange = e => { state.ui = e.target.value; render(); };

  // Quick Action: Share monthly summary
  if ($('#btnShareSummary')) {
    $('#btnShareSummary').onclick = () => {
      const rows = filtered(state.month);
      const a = agg(rows);
      const ownerTotal = rows.reduce((t, s) => t + s.owner, 0);
      const workerTotal = rows.reduce((t, s) => t + s.worker, 0);
      state.modal = {
        type: 'lineSlip',
        data: {
          farm: state.farm === 'all' ? 'f1' : state.farm,
          date: state.month + '-01',
          produce: 'สรุปรวมประจำเดือน ' + monthLabel(state.month),
          weight: a.weight.toFixed(3),
          price: (a.average || 0).toFixed(2),
          total: a.total,
          owner: ownerTotal,
          worker: workerTotal
        }
      };
      renderModals();
    };
  }

  // Date Modal Open
  if ($('#btnOpenCalendar') || $('#saleDateDisplay')) {
    const openCal = () => {
      const cur = $('#saleDate').value || today();
      calSelectedDate = cur;
      [calYear, calMonth] = cur.split('-').map(Number);
      calMonth--;
      state.modal = { type: 'calendar' };
      renderModals();
    };
    if ($('#btnOpenCalendar')) $('#btnOpenCalendar').onclick = openCal;
    if ($('#saleDateDisplay')) $('#saleDateDisplay').onclick = openCal;
  }

  // Receipt File Attachment & Camera
  if ($('#btnTriggerUpload') || $('#btnChangeReceipt')) {
    const triggerUpload = () => $('#receiptFileInput').click();
    if ($('#btnTriggerUpload')) $('#btnTriggerUpload').onclick = triggerUpload;
    if ($('#btnChangeReceipt')) $('#btnChangeReceipt').onclick = triggerUpload;
  }

  if ($('#btnUseSampleReceipt')) {
    $('#btnUseSampleReceipt').onclick = () => {
      state.currentDraftReceipt = sampleReceiptSvg;
      render();
      toast('แนบรูปตัวอย่างใบชั่งน้ำหนักเรียบร้อย');
    };
  }

  if ($('#btnRemoveReceipt')) {
    $('#btnRemoveReceipt').onclick = () => {
      state.currentDraftReceipt = null;
      render();
      toast('ลบรูปใบเสร็จแล้ว');
    };
  }

  if ($('#btnPreviewThumb')) {
    $('#btnPreviewThumb').onclick = () => {
      state.modal = { type: 'receiptLightbox', data: state.currentDraftReceipt };
      renderModals();
    };
  }

  if ($('#receiptFileInput')) {
    $('#receiptFileInput').onchange = e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        state.currentDraftReceipt = ev.target.result;
        render();
        toast('ถ่ายภาพ/แนบรูปใบเสร็จสำเร็จ');
      };
      reader.readAsDataURL(file);
    };
  }

  // Sale Detail Receipt Lightbox & LINE Slip
  const openLightbox = () => {
    const s = sales.find(x => x.id === state.id);
    if (s?.receiptImage) {
      state.modal = { type: 'receiptLightbox', data: s.receiptImage };
      renderModals();
    }
  };
  if ($('#btnOpenReceiptLightbox')) $('#btnOpenReceiptLightbox').onclick = openLightbox;
  if ($('#btnViewFullReceipt')) $('#btnViewFullReceipt').onclick = openLightbox;

  if ($('#btnOpenLineSlip')) {
    $('#btnOpenLineSlip').onclick = () => {
      const s = sales.find(x => x.id === state.id);
      if (s) {
        state.modal = { type: 'lineSlip', data: s };
        renderModals();
      }
    };
  }

  // Sale Form Validation & Submission
  if ($('#saleForm')) {
    ['weight', 'price', 'share'].forEach(id => {
      if ($('#' + id)) $('#' + id).oninput = () => updateCalc();
    });

    $('#saleFarm').onchange = () => {
      $('#share').value = '';
      updateCalc();
    };

    if (state.page === 'edit') updateCalc();

    $('#saleForm').onsubmit = e => {
      e.preventDefault();
      const c = updateCalc(true);
      const d = $('#saleDate').value;
      if (!d || d > today()) {
        $('#formError').innerHTML = '<div class="error">กรอกวันที่ วัน/เดือน/ปี พ.ศ. ที่ถูกต้อง และไม่เกินวันนี้ตามเวลาไทย</div>';
        return;
      }
      if (!c) {
        $('#share').focus();
        return;
      }

      let old = state.page === 'edit' ? sales.find(x => x.id === state.id) : null;
      let f = farm($('#saleFarm').value);
      let mode = old?.mode || f.mode;
      let stamp = new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(new Date());

      const item = {
        id: old?.id || 's' + (++serial),
        farm: f.id,
        produce: old?.produce || f.produce,
        mode,
        date: d,
        weight: $('#weight').value,
        price: $('#price').value,
        share: $('#share').value,
        total: c.total,
        owner: mode === 'OWNER' ? c.share : c.other,
        worker: mode === 'WORKER' ? c.share : c.other,
        version: (old?.version || 0) + 1,
        receiptImage: state.currentDraftReceipt,
        history: [
          ...(old?.history || []),
          {
            event: old ? 'แก้ไขรายการ' : 'สร้างรายการ',
            at: stamp,
            by: 'ผู้ใช้ตัวอย่าง',
            note: old ? `ยอดเดิม ฿${money(old.total)} → ยอดใหม่ ฿${money(c.total)}` : (state.currentDraftReceipt ? 'แนบรูปใบชั่งน้ำหนัก' : '')
          }
        ]
      };

      if (old) Object.assign(old, item);
      else sales.push(item);

      state.month = d.slice(0, 7);
      state.farm = f.id;
      state.currentDraftReceipt = null;
      navigate('detail', item.id);
      toast(old ? 'บันทึกการแก้ไขแล้ว' : 'บันทึกการขายแล้ว');
    };
  }

  // Farm Form Submit
  if ($('#farmForm')) {
    $('#farmForm').onsubmit = e => {
      e.preventDefault();
      let f = farm(state.id), name = $('#farmName').value.trim(), produce = $('#farmProduce').value.trim();
      if (!name || !produce) {
        toast('กรอกชื่อฟาร์มและผลผลิต');
        return;
      }
      if (f.mode !== $('#farmMode').value && !confirm('เปลี่ยนด้านที่กรอกสำหรับรายการใหม่? รายการเก่าจะคงรูปแบบเดิม')) return;
      Object.assign(f, {
        name,
        produce,
        mode: $('#farmMode').value,
        active: $('#farmActive').value === 'yes',
        version: f.version + 1
      });
      render();
      toast('บันทึกข้อมูลฟาร์มแล้ว');
    };
  }
}

// Global Escape Key Listener to close any open modal or drawer
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (state.modal) closeModal();
    if (state.drawerOpen) {
      state.drawerOpen = false;
      const drawerOverlay = $('#drawerOverlay');
      if (drawerOverlay) drawerOverlay.classList.remove('open');
    }
  }
});

render();
