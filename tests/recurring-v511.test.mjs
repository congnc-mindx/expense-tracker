import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { defaultCategoryConfig } from "../src/utils/categoryConfig.js";
import { recurringType, validateRecurringRule, recurringForMonth, recurringTransactionId } from "../src/utils/recurringExpenses.js";
import { isActual, totals } from "../src/utils/finance.js";
import { parseThousandsToVnd } from "../src/utils/moneyInput.js";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const config = defaultCategoryConfig();
const expense = { id: "old_expense", title: "Tiền nhà", category: "food", amount: 3_500_000, day: 31, startMonth: "2026-01", endMonth: "", active: true };
const income = { id: "monthly_income", type: "income", title: "Lương", category: "salary", amount: 25_000_000, day: 5, startMonth: "2026-01", endMonth: "", active: true };

test("Quy tắc chi cũ không có type vẫn là khoản chi; income có type tường minh", () => {
  assert.equal(recurringType(expense), "expense");
  assert.equal(recurringType(income), "income");
  assert.equal(validateRecurringRule(expense, config).type, "expense");
  assert.equal(validateRecurringRule(income, config).type, "income");
});
test("Thu định kỳ bắt buộc chọn danh mục thu, không được dùng danh mục chi", () => {
  assert.throws(() => validateRecurringRule({ ...income, category: "food" }, config));
  assert.throws(() => validateRecurringRule({ ...income, type: "expense" }, config));
  assert.throws(() => validateRecurringRule({ ...income, type: "other" }, config));
  assert.equal(validateRecurringRule({ ...income, amount: parseThousandsToVnd("355") }, config).amount, 355_000);
});
test("Chi định kỳ tự tính khi đến tháng, thu định kỳ vẫn là dự kiến", () => {
  const tx = recurringForMonth([expense, income], "2026-02", []);
  assert.equal(tx.length, 2);
  assert.deepEqual(tx.map(t => t.type).sort(), ["expense", "income"]);
  assert.equal(tx.find(t => t.type === "income").date, "2026-02-05");
  assert.equal(tx.find(t => t.type === "expense").date, "2026-02-28");
  assert.equal(isActual(tx[0], "2026-12-31"), true);
  assert.deepEqual(totals(tx, "2026-11-01"), { income: 0, expense: 3_500_000 });
});
test("Xác nhận kỳ thu nhập không tái xuất hiện, kỳ chi khác vẫn còn", () => {
  const id = recurringTransactionId(income.id, "2026-02");
  const tx = recurringForMonth([expense, income], "2026-02", [{ id }]);
  assert.equal(tx.length, 1);
  assert.equal(tx[0].type, "expense");
});
test("Dừng lịch và giới hạn tháng áp dụng cho cả hai chiều", () => {
  assert.equal(recurringForMonth([{ ...income, active: false }], "2026-05", []).length, 0);
  assert.equal(recurringForMonth([{ ...income, endMonth: "2026-04" }], "2026-05", []).length, 0);
  assert.equal(recurringForMonth([income], "2025-12", []).length, 0);
});
test("Popup ghi nhận chung có tùy chọn lặp, không tạo giao dịch cùng lúc", () => {
  const modal = read("src/components/finance/TransactionModal.jsx");
  assert.match(modal, /Lặp lại hằng tháng/);
  assert.match(modal, /if \(repeatMonthly && !transaction\)/);
  assert.match(modal, /await onSaveRecurring/);
  assert.match(modal, /await onSave\(/);
  assert.match(modal, /title: draft\.note\.trim\(\)/);
});
test("Ba tab khoản chi / khoản thu / định kỳ dùng chung trang", () => {
  const workspace = read("src/components/finance/TransactionsWorkspace.jsx");
  for (const label of ["Khoản chi", "Khoản thu", "Định kỳ"]) assert.ok(workspace.includes(label));
  assert.match(workspace, /type === "recurring"/);
  assert.match(workspace, /<RecurringManager/);
});
test("Ghi nhận kỳ thu và chi sử dụng cùng Firestore transaction tránh trùng", () => {
  const hook = read("src/hooks/useTransactions.js");
  const app = read("src/App.jsx");
  assert.match(hook, /runTransaction\(db/);
  assert.match(hook, /type:tx\.type/);
  assert.match(hook, /if\(existing\.exists\(\)\)/);
  assert.match(app, /recurringType\(rule\) !== tx\.type/);
  assert.match(app, /await saveRecurringPayment/);
  assert.match(app, /transaction\.set\(ref, \{ items: next/);
});
