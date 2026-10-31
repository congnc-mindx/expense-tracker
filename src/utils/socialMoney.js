/** Social ledger input/display uses thousands of VND; Firestore remains exact VND. */
export function parseSocialThousands(value) {
  const text = String(value ?? "").trim().replace(/\s/g, "").replace(/\./g, "");
  if (!/^\d+(?:,\d{1,3})?$/.test(text)) return NaN;
  const amount = Math.round(Number(text.replace(",", ".")) * 1000);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : NaN;
}
export function toSocialThousands(amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0) return "";
  const major = Math.floor(amount / 1000).toLocaleString("vi-VN");
  const remainder = amount % 1000;
  return remainder ? `${major},${String(remainder).padStart(3, "0").replace(/0+$/, "")}` : major;
}
export function formatThousands(amount) {
  return toSocialThousands(amount) || "0";
}
