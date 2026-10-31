import { boundedDate, MIN_YEAR, MAX_YEAR } from "./dateLimits.js";
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const [y, m, d] = value.split("-").map(Number);
  return (
    y >= MIN_YEAR &&
    y <= MAX_YEAR &&
    m >= 1 &&
    m <= 12 &&
    d >= 1 &&
    d <= new Date(y, m, 0).getDate()
  );
}
export function isActual(tx, today = localDate()) {
  return validDate(tx.date) && tx.date <= today && tx.status !== "planned";
}
export function monthRows(transactions, month) {
  return transactions.filter((tx) => tx.date?.startsWith(`${month}-`));
}
export function totals(transactions) {
  return transactions
    .filter((tx) => isActual(tx))
    .reduce(
      (result, tx) => {
        if (tx.type === "income" || tx.type === "expense")
          result[tx.type] += Number(tx.amount) || 0;
        return result;
      },
      { income: 0, expense: 0 },
    );
}
export function shiftMonth(month, step) {
  const [year, number] = month.split("-").map(Number);
  const candidate = localDate(new Date(year, number - 1 + step, 1)).slice(0, 7);
  return boundedDate(`${candidate}-01`) ? candidate : month;
}
export function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
