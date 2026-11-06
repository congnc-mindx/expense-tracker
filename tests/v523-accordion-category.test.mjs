import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");

test("Khoản chi dùng lại dropdown cũ, chỉ mở danh mục trong nhóm được chọn", () => {
  const modal = read("components/finance/TransactionModal.jsx");
  const dropdown = read("components/common/SmartSelect.jsx");

  assert.match(modal, /<ExpenseCategoryPicker/);
  assert.match(modal, /<SmartSelect[\s\S]*?accordionGroups/);
  assert.match(modal, /label: group\.name/);
  assert.match(modal, /category\.groupId === group\.id/);
  assert.match(modal, /category\.hidden \|\| category\.id === value/);
  assert.doesNotMatch(modal, /function CategoryButton/);

  assert.match(dropdown, /accordionGroups = false/);
  assert.match(dropdown, /setExpandedGroup\(null\)/);
  assert.match(dropdown, /aria-expanded=\{expandedGroup === groupIndex\}/);
  assert.match(dropdown, /expandedGroup === groupIndex\) && <div/);
  assert.match(dropdown, /<FloatingPanel/);
  assert.match(dropdown, /role="option"/);
  assert.match(dropdown, /aria-selected/);
});

test("Không làm thay đổi bộ chọn danh mục của khoản thu và những dropdown khác", () => {
  const modal = read("components/finance/TransactionModal.jsx");
  assert.match(modal, /function IncomeCategoryPicker/);
  assert.match(modal, /return <SmartSelect label="Danh mục"/);
  assert.match(modal, /SUGGESTED_AMOUNTS = \[50, 100, 200, 500\]/);
  assert.match(modal, /parseThousandsToVnd/);
  assert.match(modal, /<DatePicker/);
  assert.match(modal, /onSaveRecurring/);
});
