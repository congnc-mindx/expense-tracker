import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveMonthlyBudget } from "../src/utils/budgetInheritance.js";
import { monthlyAnalytics, yearlyAnalytics } from "../src/utils/summaryAnalytics.js";

const budgetRows = [
  { id: "2026-10", total: 10_000_000, categories: { food: 1_000_000 } },
  { id: "2026-11", total: 10_000_000, categories: { food: 2_000_000 } },
];

test("Tháng 10 giữ hạn mức gốc, tháng 11 và 12 dùng mức mới", () => {
  const october = resolveMonthlyBudget(budgetRows, "2026-10");
  const november = resolveMonthlyBudget(budgetRows, "2026-11");
  const december = resolveMonthlyBudget(budgetRows, "2026-12");
  assert.equal(october.budget.categories.food, 1_000_000);
  assert.equal(november.budget.categories.food, 2_000_000);
  assert.equal(december.budget.categories.food, 2_000_000);
  assert.equal(december.sourceMonth, "2026-11");
  assert.equal(december.inherited, true);
  assert.equal(october.inherited, false);
});

test("Ngân sách không rò ngược từ tương lai và không làm đột biến snapshot cũ", () => {
  const prior = resolveMonthlyBudget(budgetRows, "2026-09");
  assert.equal(prior.budget.total, 0);
  const next = resolveMonthlyBudget(budgetRows, "2026-12");
  next.budget.categories.food = 9;
  assert.equal(budgetRows[1].categories.food, 2_000_000);
});

test("Snapshot xóa về 0 chặn kế thừa từ kỳ trước", () => {
  const list = [...budgetRows, { id: "2027-01", total: 0, categories: {} }];
  assert.equal(resolveMonthlyBudget(list, "2027-02").budget.categories.food, undefined);
  assert.equal(resolveMonthlyBudget(list, "2027-02").budget.total, 0);
  assert.equal(resolveMonthlyBudget(list, "2026-12").budget.categories.food, 2_000_000);
});

test("Bản ghi tháng và thứ tự không hợp lệ được bỏ qua", () => {
  const list = [
    { id: "2026-13", total: 999, categories: {} },
    { id: "random", total: 999, categories: {} },
    ...budgetRows.slice().reverse(),
  ];
  assert.equal(resolveMonthlyBudget(list, "2026-12").budget.total, 10_000_000);
  assert.equal(resolveMonthlyBudget(list, "nope").budget.total, 0);
});

const txs = [
  { type: "expense", category: "food", amount: 100_000, date: "2026-10-01" },
  { type: "income", category: "salary", amount: 300_000, date: "2026-10-05" },
  { type: "expense", category: "food", amount: 500_000, date: "2026-10-19", status: "planned" },
  { type: "expense", category: "food", amount: 80_000, date: "2026-12-18" },
];
const now = new Date();
const priorYear = String(now.getFullYear() - 1);
const actualTxs = txs.map((x) => ({ ...x, date: x.date.replace(/^2026/, priorYear) }));

test("Biểu đồ theo tuần và ngày cộng chi dự kiến khi đã đến tháng", () => {
  const analytics = monthlyAnalytics(actualTxs, `${priorYear}-10`);
  assert.equal(analytics.expense, 600_000);
  assert.equal(analytics.income, 300_000);
  assert.equal(analytics.balance, -300_000);
  assert.equal(analytics.categories[0].amount, 600_000);
  assert.equal(analytics.periods.reduce((n, item) => n + item.expense, 0), 600_000);
  assert.equal(analytics.daily.at(-1).balance, -300_000);
});

test("Biểu đồ năm cộng chi đã đến tháng, không cộng tháng tương lai", () => {
  const analytics = yearlyAnalytics(actualTxs, Number(priorYear));
  assert.equal(analytics.totalExpense, 680_000);
  assert.equal(analytics.totalIncome, 300_000);
  assert.equal(analytics.categories[0].amount, 680_000);
  assert.equal(analytics.accumulated.at(-1).balance, -380_000);
});

test("Các thao tác xác nhận loại bỏ popup window và dùng component chung", () => {
  const targets = [
    "src/App.jsx", "src/pages/BudgetPage.jsx", "src/pages/PlansPage.jsx",
    "src/components/settings/CategoryManager.jsx", "src/components/settings/GroupManagerDialog.jsx",
  ];
  for (const name of targets) {
    const code = readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
    assert.match(code, /useConfirm/);
    assert.doesNotMatch(code, /window\.(?:confirm|alert|prompt)\(/);
  }
});
