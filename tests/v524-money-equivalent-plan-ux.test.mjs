import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseThousandsToVnd, formatVndAsThousands } from "../src/utils/moneyInput.js";
import { formatMoney } from "../src/utils/money.js";

const source = (path) => readFileSync(new URL(`../src/components/${path}`, import.meta.url), "utf8");

test("Quy đổi nghìn đồng ra VND chính xác, không nhân thêm khi mở sửa", () => {
  for (const [text, vnd, shown] of [
    ["30", 30_000, "30.000 đ"],
    ["1000", 1_000_000, "1.000.000 đ"],
    ["355,5", 355_500, "355.500 đ"],
    ["2.000", 2_000_000, "2.000.000 đ"],
  ]) {
    assert.equal(parseThousandsToVnd(text), vnd);
    assert.equal(formatMoney(vnd), shown);
    assert.equal(parseThousandsToVnd(formatVndAsThousands(vnd)), vnd);
  }
});

test("Có một component duy nhất cho dòng Tương đương ở mọi form tiền", () => {
  const equivalent = source("common/MoneyEquivalent.jsx");
  assert.match(equivalent, /Tương đương:/);
  assert.match(equivalent, /parseThousandsToVnd/);
  assert.match(equivalent, /formatMoney\(amount\)/);
  for (const form of [
    "plans/PlanDialog.jsx",
    "plans/PlanTaskEditor.jsx",
    "finance/TransactionModal.jsx",
    "finance/YearGoalsDialog.jsx",
    "budget/BudgetLimitDialog.jsx",
    "social/SocialEntryModal.jsx",
    "debts/DebtFormDialog.jsx",
    "debts/DebtDetailsDialog.jsx",
    "recurring/RecurringRuleDialog.jsx",
    "settings/MindxIncomePanel.jsx",
  ]) assert.match(source(form), /<MoneyEquivalent\s+value=/, `Thiếu dòng quy đổi ở ${form}`);
});

test("Popup kế hoạch chia rõ thông tin cơ bản, checklist mở rộng và footer cố định", () => {
  const dialog = source("plans/PlanDialog.jsx");
  const tasks = source("plans/PlanTaskEditor.jsx");
  assert.match(dialog, /<PlanTaskEditor/);
  assert.match(dialog, /max-h-\[92dvh\]/);
  assert.match(dialog, /overflow-y-auto/);
  assert.match(dialog, /<footer/);
  assert.match(dialog, /validatePlan/);
  assert.match(dialog, /planFunding/);
  assert.match(tasks, /aria-expanded=\{expanded\}/);
  assert.match(tasks, /tasks.length > 0/);
  assert.match(tasks, /onChangeTask/);
  assert.match(tasks, /onRemoveTask/);
});

test("Tạo và sửa kế hoạch giữ nguyên số tiền VND trong dữ liệu Firestore", () => {
  const dialog = source("plans/PlanDialog.jsx");
  assert.match(dialog, /const targetAmount = parseThousandsToVnd\(targetText\)/);
  assert.match(dialog, /const savedAmount = amountOf\(preparedText\)/);
  assert.match(dialog, /await onSave\(clean, plan\?\.id\)/);
  assert.match(dialog, /\.\.\.rowAmounts/);
});
