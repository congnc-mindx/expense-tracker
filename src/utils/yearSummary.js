export function createYearPlan() {
  return Array.from({ length: 12 }, () => ({ target: null, savings: 0 }));
}

export function isYearPlan(value) {
  const money = (number) => Number.isSafeInteger(number) && number >= 0;
  return (
    Array.isArray(value) &&
    value.length === 12 &&
    value.every(
      (item) =>
        item &&
        (item.target === null || money(item.target)) &&
        money(item.savings),
    )
  );
}

export function buildYearSummary(transactions, year, plan, now = new Date()) {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const rows = plan.map((item, index) => ({
    month: index + 1,
    target: item.target,
    savings: item.savings,
    income: 0,
    expense: 0,
    future:
      year > now.getFullYear() ||
      (year === now.getFullYear() && index + 1 > now.getMonth() + 1),
  }));
  for (const tx of transactions) {
    if (
      !tx ||
      tx.status === "planned" ||
      typeof tx.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tx.date) ||
      tx.date > today
    )
      continue;
    const [y, m, d] = tx.date.split("-").map(Number);
    if (
      y !== year ||
      m < 1 ||
      m > 12 ||
      d < 1 ||
      d > new Date(y, m, 0).getDate()
    )
      continue;
    const amount = Number(tx.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) continue;
    if (tx.type === "income") rows[m - 1].income += amount;
    if (tx.type === "expense") rows[m - 1].expense += amount;
  }
  for (const row of rows) {
    row.balance = row.income - row.expense;
    row.hasTarget = row.target !== null && row.target > 0;
    row.reached = !row.future && row.hasTarget && row.income >= row.target;
    row.status = row.future
      ? "Chưa đến kỳ"
      : !row.hasTarget
        ? "Chưa đặt mục tiêu"
        : row.income > row.target
          ? "Vượt"
          : row.reached
            ? "Đạt"
            : year === now.getFullYear() && row.month === now.getMonth() + 1
              ? "Đang thực hiện"
              : "Chưa đạt";
  }
  const sum = (field) =>
    rows.reduce((total, row) => total + (row[field] || 0), 0);
  return {
    rows,
    target: sum("target"),
    income: sum("income"),
    expense: sum("expense"),
    savings: rows
      .filter((row) => !row.future)
      .reduce((total, row) => total + row.savings, 0),
    balance: sum("balance"),
    reached: rows.filter((row) => row.reached).length,
    eligible: rows.filter((row) => !row.future && row.hasTarget).length,
  };
}
