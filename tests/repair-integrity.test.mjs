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
});

test("Quản lý danh mục chặn xóa khi đã có giao dịch", () => {
  const categories = read("src/components/settings/CategoryManager.jsx");
  assert.match(categories, /usedCategoryIds\.includes\(id\)/);
  assert.match(categories, /saving \|\| usedCategoryIds\.includes\(cat\.id\)/);
  assert.match(categories, /toggleCategory/);
  assert.match(categories, /removeGroup/);
});

test("Trang ngân sách có thao tác lưu, sửa và xóa hạn mức", () => {
  const page = read("src/pages/BudgetPage.jsx");
  for (const word of ["Xóa hạn mức", "Lưu ngân sách", "Xóa toàn bộ hạn mức", "window.confirm"]) assert.ok(page.includes(word));
});
