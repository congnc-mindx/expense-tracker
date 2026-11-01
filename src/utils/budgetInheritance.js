/**
 * Budget snapshots are effective from their YYYY-MM document ID onward.
 * Each edit writes a complete snapshot at the edited month. Earlier months never change.
 * A zero snapshot intentionally clears subsequent months until a newer snapshot exists.
 */
const MONTH_ID = /^(20\d{2})-(0[1-9]|1[0-2])$/;
export const EMPTY_BUDGET = Object.freeze({ total: 0, categories: {} });

export function resolveMonthlyBudget(budgets = [], selectedMonth) {
  if (!MONTH_ID.test(selectedMonth)) return { budget: EMPTY_BUDGET, sourceMonth: null, inherited: false };
  let source = null;
  for (const item of budgets) {
    if (!MONTH_ID.test(String(item?.id || "")) || item.id > selectedMonth) continue;
    if (!source || item.id > source.id) source = item;
  }
  if (!source) return { budget: EMPTY_BUDGET, sourceMonth: null, inherited: false };
  return {
    budget: { total: source.total, categories: { ...(source.categories || {}) } },
    sourceMonth: source.id,
    inherited: source.id !== selectedMonth,
  };
}
