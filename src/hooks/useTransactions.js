import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

const INITIAL_SAMPLE_DATA = [
  {
    id: "tx-1",
    type: "income",
    amount: 25000000,
    category: "salary",
    note: "Lương tháng này",
    date: new Date().toISOString().split("T")[0],
  },
  {
    id: "tx-2",
    type: "expense",
    amount: 150000,
    category: "food",
    note: "Ăn trưa & Cà phê",
    date: new Date().toISOString().split("T")[0],
  },
  {
    id: "tx-3",
    type: "expense",
    amount: 1200000,
    category: "bills",
    note: "Tiền điện & Internet",
    date: new Date().toISOString().split("T")[0],
  },
  {
    id: "tx-4",
    type: "expense",
    amount: 450000,
    category: "other_expense",
    note: "Mua phụ kiện cá nhân",
    date: new Date().toISOString().split("T")[0],
  },
];

export function useTransactions() {
  const [transactions, setTransactions] = useLocalStorage(
    "sage_expense_transactions_v1",
    INITIAL_SAMPLE_DATA,
  );

  const addTransaction = useCallback(
    (newTx) => {
      const transaction = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: newTx.type || "expense",
        amount: Number(newTx.amount) || 0,
        category: newTx.category || "other_expense",
        note: (newTx.note || "").trim(),
        date: newTx.date || new Date().toISOString().split("T")[0],
        createdAt: Date.now(),
      };

      setTransactions((prev) => [transaction, ...prev]);
      return transaction;
    },
    [setTransactions],
  );

  const deleteTransaction = useCallback(
    (id) => {
      setTransactions((prev) => prev.filter((item) => item.id !== id));
    },
    [setTransactions],
  );

  // Tự động trích xuất danh sách các năm có dữ liệu để đưa vào bộ lọc
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set([currentYear, currentYear - 1]);
    transactions.forEach((tx) => {
      if (tx.date) {
        const y = new Date(tx.date).getFullYear();
        if (!Number.isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions]);

  return {
    transactions,
    addTransaction,
    deleteTransaction,
    availableYears,
  };
}
