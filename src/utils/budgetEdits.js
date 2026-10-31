/** All persisted budgets are VND, not thousands of VND. Never mutate Firestore snapshots. */
export function budgetWithLimit(budget, { categoryId = null, amount }) {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error("Hạn mức phải là số nguyên VND không âm.");
  }
  const next = { total: Number(budget?.total) || 0, categories: { ...(budget?.categories || {}) } };
  if (categoryId === null) next.total = amount;
  else if (typeof categoryId !== "string" || !categoryId.trim()) throw new Error("Danh mục không hợp lệ.");
  else if (amount === 0) delete next.categories[categoryId];
  else next.categories[categoryId] = amount;
  return next;
}

/** A historical budget may reference a category even if transactions do not. */
export function categoryIdsInBudgets(budgets) {
  return [...new Set((budgets || []).flatMap((budget) =>
    Object.entries(budget?.categories || {}).filter(([, amount]) => Number(amount) > 0).map(([id]) => id),
  ))];
}
