export function formatMoney(value) {
  const amount = Number(value);
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0)} đ`;
}
export function parseMoneyInput(value) {
  if (typeof value === "number") return value;
  const digits = String(value ?? "").replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}
