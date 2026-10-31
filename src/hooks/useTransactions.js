import { useMemo } from "react";
import { useCloudCollection } from "../firebase/useCloudCollection";
import { defaultCategoryConfig } from "../utils/categoryConfig.js";
import { validDate } from "../utils/finance";

export function validateTransaction(tx, config = defaultCategoryConfig()) {
  const categories = tx.type === "expense" ? config.expense : tx.type === "income" ? config.income : [];
  const amount = Number(tx.amount);
  if (!Number.isSafeInteger(amount) || amount <= 0 || !validDate(tx.date) || !categories.some((c) => c.id === tx.category))
    throw new Error("Giao dịch không hợp lệ. Kiểm tra số tiền, ngày và danh mục.");
  if (!["actual", "planned"].includes(tx.status)) throw new Error("Trạng thái không hợp lệ.");
  return { type: tx.type, amount, date: tx.date, category: tx.category, status: tx.status,
    note: String(tx.note || "").trim().slice(0, 500), source: String(tx.source || "").trim().slice(0, 100) };
}
export function useTransactions(uid, config) {
  const store = useCloudCollection(uid, "transactions");
  const transactions = store.rows;
  async function saveTransaction(draft, id) {
    const clean = validateTransaction(draft, config);
    if (store.loading || store.error) throw new Error(store.error || "Dữ liệu chưa tải xong.");
    if (id && !transactions.some((tx) => tx.id === id)) throw new Error("Giao dịch không tồn tại hoặc đã bị xóa.");
    const existing = id ? transactions.find((tx) => tx.id === id) : null;
    await store.save(id || crypto.randomUUID(), { ...clean, createdAt: existing?.createdAt || Date.now(), updatedAt: Date.now() });
  }
  async function deleteTransaction(id) {
    if (store.loading || store.error) throw new Error(store.error || "Dữ liệu chưa tải xong.");
    await store.remove(id);
  }
  const availableYears = useMemo(() => [...new Set([new Date().getFullYear(), ...transactions.map((tx) => Number(tx.date.slice(0, 4)) )])].sort((a,b) => b-a), [transactions]);
  return { transactions, saveTransaction, deleteTransaction, availableYears, error: store.error, loading: store.loading };
}
