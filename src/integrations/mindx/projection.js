import { validSalaryPeriod } from "./periods.js";
import { localDate } from "../../utils/finance.js";

/** Salary is attributed to its WORK month, regardless of the bank transfer date.
 * These are read-only projections; no duplicate transaction is written to Firestore.
 */
export function mindxSalaryTransactions(rows = [], accountUid, existing = [], category = "mindx", today = localDate()) {
  if (!accountUid) return [];
  return rows.filter(validSalaryPeriod)
    .filter((row) => row.expectedIncome > 0)
    .map((row) => ({
      id: `mindx-projection-${accountUid}-${row.period}`,
      type: "income", origin: "mindx", virtual: true, mindxPeriod: row.period,
      category, amount: row.expectedIncome, date: `${row.period}-01`,
      status: row.period <= today.slice(0, 7) ? "actual" : "planned",
      note: `Lương mindX tháng ${Number(row.period.slice(5))}/${row.period.slice(0, 4)}`,
      source: "mindX Salary Tracker", updatedAt: row.updatedAt || 0,
    }));
}

/** Old "Ghi đã nhận" records remain in Firestore but are not counted a
 * second time when their earning-period source row is now linked.
 */
export function legacyMindxReceiptsExcluded(transactions = [], salaryRows = [], accountUid) {
  if (!accountUid) return transactions;
  const periods = new Set(salaryRows.filter(validSalaryPeriod).map((row) => row.period));
  return transactions.filter((tx) => !(tx.mindxPeriod && periods.has(tx.mindxPeriod)
    && (tx.mindxSourceUid === accountUid || tx.id === `mindx-${accountUid}-${tx.mindxPeriod}`)));
}
