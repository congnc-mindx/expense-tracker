import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { budgetWithLimit, categoryIdsInBudgets } from "../src/utils/budgetEdits.js";
import { parseThousandsToVnd, formatVndAsThousands } from "../src/utils/moneyInput.js";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Sửa hạn mức danh mục không làm mất ngân sách tổng hoặc danh mục khác", () => {
  const old = { total: 15_000_000, categories: { food: 3_000_000, transport: 500_000 } };
  const result = budgetWithLimit(old, { categoryId: "food", amount: 4_000_000 });
  assert.deepEqual(result, { total: 15_000_000, categories: { food: 4_000_000, transport: 500_000 } });
  assert.equal(old.categories.food, 3_000_000);
  assert.equal(result.categories.transport, 500_000);
});

test("Đặt hoặc xóa hạn mức chung không xóa các danh mục", () => {
  const start = { total: 15_000_000, categories: { food: 3_000_000 } };
  const edited = budgetWithLimit(start, { amount: 20_000_000 });
  const reset = budgetWithLimit(edited, { amount: 0 });
  assert.equal(reset.total, 0);
  assert.equal(reset.categories.food, 3_000_000);
});

test("Xóa một hạn mức chỉ xóa danh mục tương ứng", () => {
  const result = budgetWithLimit({ total: 10_000_000, categories: { a: 100_000, b: 200_000 } }, { categoryId: "a", amount: 0 });
  assert.deepEqual(result.categories, { b: 200_000 });
});

test("Hạn mức không hợp lệ bị từ chối", () => {
  for (const amount of [-1, NaN, Infinity, 3.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => budgetWithLimit({ total: 0, categories: {} }, { amount }));
  }
});

test("Dùng dữ liệu ngân sách nhiều tháng để khóa xóa danh mục", () => {
  const ids = categoryIdsInBudgets([{ categories: { food: 3_000_000, transport: 0 } }, { categories: { phone: 1_000_000, food: 100_000 } }]);
  assert.deepEqual(ids.sort(), ["food", "phone"]);
});

test("Hạn mức popup vẫn nhập theo nghìn đồng, Firebase lưu VND", () => {
  assert.equal(parseThousandsToVnd("355"), 355_000);
  assert.equal(parseThousandsToVnd("2.000"), 2_000_000);
  assert.equal(formatVndAsThousands(2_000_000), "2.000");
  assert.match(source("src/components/budget/BudgetLimitDialog.jsx"), /parseThousandsToVnd/);
  assert.match(source("src/components/budget/BudgetLimitDialog.jsx"), /formatVndAsThousands/);
});

test("Không chỉnh sửa collections thu chi khi lưu ngân sách", () => {
  const page = source("src/pages/BudgetPage.jsx");
  assert.doesNotMatch(page, /saveTransaction|deleteTransaction|addDoc/);
  assert.match(page, /onSave/);
});

test("Danh mục có tab, tìm kiếm và form chỉnh sửa riêng", () => {
  const manager = source("src/components/settings/CategoryManager.jsx");
  assert.match(manager, /setType/);
  assert.match(manager, /setQuery/);
  assert.match(manager, /CategoryEditorDialog/);
  assert.match(manager, /GroupManagerDialog/);
  assert.match(manager, /usedCategoryIds\.includes\(id\)/);
});
