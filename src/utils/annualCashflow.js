import { isActual } from "./finance.js";

/** Aggregate already combined standard + social ledger transactions.
 * The chart is read-only; no second transaction is written to Firestore.
 */
export function annualCashflow(transactions = [], year, today) {
  const selectedYear = Number(year);
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    key: `${selectedYear}-${String(index + 1).padStart(2, "0")}`,
    income: 0,
    expense: 0,
  }));

  for (const transaction of transactions) {
    if (!transaction || (transaction.type !== "income" && transaction.type !== "expense")) continue;
    if (!isActual(transaction, today)) continue;
    const monthKey = String(transaction.date).slice(0, 7);
    const index = Number(monthKey.slice(5, 7)) - 1;
    if (index < 0 || index >= 12 || monthKey !== months[index].key) continue;
    const amount = Number(transaction.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    months[index][transaction.type] += amount;
  }

  const income = months.reduce((sum, month) => sum + month.income, 0);
  const expense = months.reduce((sum, month) => sum + month.expense, 0);
  return {
    months,
    income,
    expense,
    balance: income - expense,
    scale: Math.max(1, ...months.flatMap((month) => [month.income, month.expense])),
  };
}
