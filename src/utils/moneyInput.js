/** Form inputs use thousands of VND, persisted amounts stay in integer VND.
 * E.g. 355 -> 355000, 2.000 -> 2000000, 355,5 -> 355500.
 * The dot is a thousands grouping separator, the comma is decimal.
 */
export function parseThousandsToVnd(value, { allowZero = false } = {}) {
  const raw = String(value ?? "").trim().replace(/\s/g, "");
  if (!raw || !/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,3})?$/.test(raw)) return NaN;
  const normalized = raw.replace(/\./g, "");
  const [integer, fraction = ""] = normalized.split(",");
  const amount = Number(integer) * 1000 + Number(fraction.padEnd(3, "0"));
  return Number.isSafeInteger(amount) && (allowZero ? amount >= 0 : amount > 0) ? amount : NaN;
}

export function formatVndAsThousands(amount) {
  if (!Number.isSafeInteger(amount) || amount < 0) return "";
  const whole = Math.floor(amount / 1000).toLocaleString("vi-VN");
  const fractional = amount % 1000;
  return fractional ? `${whole},${String(fractional).padStart(3, "0").replace(/0+$/, "")}` : whole;
}

export function sanitizeThousandsInput(value) {
  return String(value ?? "").replace(/[^\d.,\s]/g, "").slice(0, 24);
}
