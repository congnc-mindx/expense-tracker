import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Thương hiệu xanh lá dùng cùng BrandMark trên Login và Sidebar", () => {
  const layout = read("src/components/finance/FinanceLayout.jsx");
  const login = read("src/auth/LoginPage.jsx");
  assert.match(layout, /<BrandMark/);
  assert.match(login, /<BrandMark/);
  assert.match(layout, /bg-emerald-600/);
  assert.doesNotMatch(layout, /bg-blue-600|◈/);
  assert.match(read("public/favicon.svg"), /#17834f/);
});

test("Chỉ mở trình quản lý danh mục sau khi tải dữ liệu Firebase", () => {
  const app = read("src/App.jsx");
  assert.match(app, /busy \? <div/);
  assert.match(app, /usedCategoryIds=\{usedCategoryIds\}/);
  assert.match(app, /Không thể xóa danh mục đang có giao dịch/);
  assert.match(app, /categoryIdsInBudgets/);
});

test("Quản lý danh mục chặn xóa khi đã có giao dịch hoặc hạn mức", () => {
  const categories = read("src/components/settings/CategoryManager.jsx");
  const editor = read("src/components/settings/CategoryEditorDialog.jsx");
  const groups = read("src/components/settings/GroupManagerDialog.jsx");
  assert.match(categories, /usedCategoryIds\.includes\(id\)/);
  assert.match(categories, /saving \|\| usedCategoryIds\.includes\(cat\.id\)/);
  assert.match(categories, /toggleCategory/);
  assert.match(categories, /removeCategory/);
  assert.match(categories, /GroupManagerDialog/);
  assert.match(editor, /onSave/);
  assert.match(groups, /removeGroup/);
});

test("Ngân sách chỉnh sửa theo từng hạn mức, có xác nhận xóa", () => {
  const page = read("src/pages/BudgetPage.jsx");
  const editor = read("src/components/budget/BudgetLimitDialog.jsx");
  assert.match(page, /Xóa hạn mức/);
  assert.match(page, /Xóa toàn bộ hạn mức/);
  assert.match(page, /window.confirm/);
  assert.match(page, /BudgetLimitDialog/);
  assert.match(editor, /Lưu hạn mức/);
});
