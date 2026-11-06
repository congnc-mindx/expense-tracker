const KEY = /^20\d\d-(0[1-9]|1[0-2])$/;
export const MINDX_SYNC_START_PERIOD = "2026-11";
/** Keep historic income records untouched; import Salary Tracker from Nov 2026 onward. */
export function inMindxSyncWindow(period) {
  return typeof period === "string" && KEY.test(period) && period >= MINDX_SYNC_START_PERIOD;
}
export function validSalaryPeriod(row) {
  return Boolean(row && KEY.test(row.period) &&
    [row.expectedIncome, row.confirmedWork, row.waitingWork].every((v) => Number.isSafeInteger(v) && v >= 0));
}
export function mindxPaymentId(uid, period) {
  if (!uid || !KEY.test(period)) throw new Error("Kỳ lương không hợp lệ.");
  return `mindx-${uid}-${period}`;
}
export function mindxIncomeRow(items, period) {
  return items.find((item) => item.period === period) || null;
}
