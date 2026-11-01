import { isActual, monthRows, totals, shiftMonth } from "./finance.js";

export function actualTransactions(transactions) {
  return (transactions || []).filter((tx) =>
    tx && (tx.type === "income" || tx.type === "expense") &&
    isActual(tx) && Number.isFinite(Number(tx.amount)) && Number(tx.amount) > 0,
  );
}

export function categoryComposition(transactions, type = "expense") {
  const counts = new Map();
  for (const tx of actualTransactions(transactions)) {
    if (tx.type !== type) continue;
    const id = tx.category || "other";
    const entry = counts.get(id) || { id, amount: 0, count: 0 };
    entry.amount += Number(tx.amount);
    entry.count++;
    counts.set(id, entry);
  }
  return [...counts.values()].sort((a, b) => b.amount - a.amount);
}

export function monthlyAnalytics(transactions, month) {
  const current = actualTransactions(monthRows(transactions, month));
  const { income, expense } = totals(current);
  const before = totals(monthRows(transactions, shiftMonth(month, -1)));
  const [year, m] = month.split("-").map(Number);
  const days = new Date(year, m, 0).getDate();
  const periods = Array.from({ length: Math.ceil(days / 7) }, (_, index) => {
    const start = index * 7 + 1;
    return { label: `${start}–${Math.min(days, start + 6)}`, income: 0, expense: 0 };
  });
  const daily = Array.from({ length: days }, (_, index) => ({ day: index + 1, income: 0, expense: 0 }));
  for (const tx of current) {
    const day = Number(tx.date.slice(8));
    const amount = Number(tx.amount);
    daily[day - 1][tx.type] += amount;
    periods[Math.floor((day - 1) / 7)][tx.type] += amount;
  }
  let running = 0;
  const accumulated = daily.map((item) => {
    running += item.income - item.expense;
    return { ...item, balance: running };
  });
  return {
    income, expense, balance: income - expense, previousIncome: before.income,
    previousExpense: before.expense, count: current.length,
    periods, daily: accumulated, categories: categoryComposition(current),
  };
}

export function yearlyAnalytics(transactions, year) {
  const rows = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, label: `T${i + 1}`, income: 0, expense: 0 }));
  const yearTransactions = actualTransactions(transactions).filter((tx) => tx.date.slice(0, 4) === String(year));
  for (const tx of yearTransactions) {
    rows[Number(tx.date.slice(5, 7)) - 1][tx.type] += Number(tx.amount);
  }
  let running = 0;
  const accumulated = rows.map((r) => {
    running += r.income - r.expense;
    return { ...r, balance: running };
  });
  const totalIncome = rows.reduce((sum, r) => sum + r.income, 0);
  const totalExpense = rows.reduce((sum, r) => sum + r.expense, 0);
  const monthsWithActivity = rows.filter((r) => r.income + r.expense > 0);
  const largestExpenseMonth = rows.filter((r) => r.expense > 0).sort((a, b) => b.expense - a.expense)[0] || null;
  return {
    rows, accumulated, totalIncome, totalExpense,
    monthsWithActivity: monthsWithActivity.length, largestExpenseMonth,
    averageExpense: monthsWithActivity.length ? totalExpense / monthsWithActivity.length : 0,
    categories: categoryComposition(yearTransactions),
  };
}
