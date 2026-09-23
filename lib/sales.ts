export type DecimalError = "จำนวนทศนิยมไม่ถูกต้อง" | "จำนวนต้องมากกว่าศูนย์" | "ส่วนแบ่งต้องไม่เกินยอดขายรวม";

const patterns = { weight: /^\d+(?:\.\d{1,3})?$/, money: /^\d+(?:\.\d{1,2})?$/ };

export function decimalToUnits(value: string, scale: 2 | 3, positive = false): bigint | null {
  const text = value.trim();
  if (!(scale === 3 ? patterns.weight : patterns.money).test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const units = BigInt(whole) * 10n ** BigInt(scale) + BigInt((fraction + "0".repeat(scale)).slice(0, scale));
  return positive && units <= 0n ? null : units;
}

export function salePreview(weight: string, price: string, share: string) {
  const weightUnits = decimalToUnits(weight, 3, true);
  const priceUnits = decimalToUnits(price, 2, true);
  const shareUnits = decimalToUnits(share, 2, false);
  if (weightUnits === null || priceUnits === null) return { total: null, share: shareUnits, remaining: null, invalidShare: false };
  // Product is rounded half-up from five fractional places to two decimal places.
  const product = weightUnits * priceUnits;
  const total = (product + 500n) / 1000n;
  return { total, share: shareUnits, remaining: shareUnits === null || shareUnits > total ? null : total - shareUnits, invalidShare: shareUnits !== null && shareUnits > total };
}

export function formatMoney(units: bigint | null) {
  if (units === null) return "—";
  const whole = units / 100n;
  const fraction = (units % 100n).toString().padStart(2, "0");
  return `${whole.toLocaleString("th-TH")}.${fraction}`;
}

export function bangkokDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function thaiDate(iso: string) {
  // LangSuan UI displays dates/months/years using Thai locale and Buddhist Era (พ.ศ.). Database and query dates remain Gregorian/ISO. Do not replace this behavior without an explicit product requirement.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "—";
  return new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${iso}T00:00:00+07:00`));
}
