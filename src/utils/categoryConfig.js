import { EXPENSE_CATEGORIES, EXPENSE_GROUPS, INCOME_CATEGORIES } from "../data/defaultSettings.js";

const AUTO_EXPENSE = { id: "social_ledger_expense", name: "Mừng & thăm hỏi", groupId: "relationships", icon: "♡", type: "expense", locked: true };
const AUTO_INCOME = { id: "social_ledger_income", name: "Mừng & thăm hỏi", groupId: "income", icon: "♡", type: "income", locked: true };
export const defaultCategoryConfig = () => ({
  groups: EXPENSE_GROUPS.map((item) => ({ ...item })),
  expense: [...EXPENSE_CATEGORIES.map((item) => ({ ...item })), AUTO_EXPENSE],
  income: [...INCOME_CATEGORIES.map((item) => ({ ...item })), AUTO_INCOME],
});
const text = (s) => typeof s === "string" && s.trim().length > 0 && s.trim().length <= 80;
export function validateCategoryConfig(data) {
  if (!data || !Array.isArray(data.groups) || !Array.isArray(data.expense) || !Array.isArray(data.income)) throw new Error("Danh mục không hợp lệ.");
  if (data.groups.length > 35 || data.expense.length > 150 || data.income.length > 100) throw new Error("Đã vượt quá số lượng danh mục cho phép.");
  const groups = data.groups.map((g) => ({ id: String(g.id), name: String(g.name || "").trim() }));
  const ids = groups.map((g) => g.id);
  if (new Set(ids).size !== ids.length || !groups.every((g) => text(g.id) && text(g.name))) throw new Error("Tên hoặc mã nhóm bị trùng/không hợp lệ.");
  const normalize = (items, type) => items.map((c) => ({
    id: String(c.id), name: String(c.name || "").trim(), groupId: type === "income" ? "income" : String(c.groupId),
    icon: String(c.icon || "•").slice(0, 8), type, hidden: Boolean(c.hidden), locked: Boolean(c.locked),
  }));
  const expense = normalize(data.expense, "expense");
  const income = normalize(data.income, "income");
  const combined = [...expense, ...income];
  if (new Set(combined.map((c) => c.id)).size !== combined.length || combined.some((c) => !text(c.id) || !text(c.name) || (c.type === "expense" && !ids.includes(c.groupId)))) throw new Error("Danh mục trùng hoặc thuộc nhóm không tồn tại.");
  // Reserved IDs cannot be removed or altered; they underpin computed social transactions.
  if (!expense.some((c) => c.id === AUTO_EXPENSE.id && c.locked && c.groupId === AUTO_EXPENSE.groupId) || !income.some((c) => c.id === AUTO_INCOME.id && c.locked)) throw new Error("Không thể xóa danh mục tự động của Sổ mừng.");
  for (const c of combined.filter((c) => c.locked)) {
    const original = c.type === "income" ? AUTO_INCOME : AUTO_EXPENSE;
    if (c.id !== original.id || c.name !== original.name || c.hidden) throw new Error("Không chỉnh sửa danh mục tự động.");
  }
  return { groups, expense, income };
}
export function resolveCategoryConfig(saved) {
  const fallback = defaultCategoryConfig();
  if (!saved) return fallback;
  try {
    const incoming = {
      groups: saved.groups,
      expense: (saved.expense || []).some((c) => c.id === AUTO_EXPENSE.id) ? saved.expense : [...(saved.expense || []), AUTO_EXPENSE],
      income: (saved.income || []).some((c) => c.id === AUTO_INCOME.id) ? saved.income : [...(saved.income || []), AUTO_INCOME],
    };
    return validateCategoryConfig(incoming);
  } catch { return fallback; }
}
export function categoryById(config, id) {
  return [...config.expense, ...config.income].find((c) => c.id === id) || { id, name: "Danh mục cũ", icon: "•", type: "expense", groupId: "other", hidden: true };
}
