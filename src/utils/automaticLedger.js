import { recurringForMonth } from "./recurringExpenses.js";
import { localDate } from "./finance.js";
/** Build read-only expenses for every elapsed month, retaining the due date for display.
 * No Firestore writes: rules are the single source of truth, and the same month is
 * never projected twice or alongside an already recorded installment.
 */
export function automaticRecurringExpenses(rules = [], transactions = [], today = localDate(), startYear = 2023) {
  const currentMonth = today.slice(0, 7);
  const currentYear = Number(today.slice(0, 4));
  const results = [];
  for (let year = startYear; year <= currentYear; year++) {
    for (let m = 1; m <= 12; m++) {
      const month = `${year}-${String(m).padStart(2, "0")}`;
      if (month > currentMonth) break;
      for (const row of recurringForMonth(rules, month, transactions)) {
        if (row.type === "expense") {
          results.push({ ...row, status: "actual", autoAccrued: true, source: "Chi định kỳ tự động" });
        }
      }
    }
  }
  return results;
}
