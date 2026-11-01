import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Sidebar gộp một trang Thu chi, giữ các trang khác", () => {
  const layout = read("src/components/finance/FinanceLayout.jsx");
  assert.match(layout, /\["transactions", "Thu chi"/);
  assert.doesNotMatch(layout, /\["expense", "Chi tiêu"|\["income", "Thu nhập"/);
  for (const page of ["overview", "budget", "summary", "plans", "social", "settings"])
    assert.match(layout, new RegExp(`\\["${page}",`));
});

test("Bộ chọn tháng có tháng trước, tháng sau, Tháng này và giới hạn năm", () => {
  const monthPicker = read("src/components/common/MonthPicker.jsx");
  assert.match(monthPicker, /Tháng trước/);
  assert.match(monthPicker, /Tháng sau/);
  assert.match(monthPicker, /Tháng này/);
  assert.match(monthPicker, /shiftMonth\(value, -1\)/);
  assert.match(monthPicker, /shiftMonth\(value, 1\)/);
  assert.match(monthPicker, /localDate\(\)\.slice\(0, 7\)/);
  assert.match(monthPicker, /MIN_YEAR/);
  assert.match(monthPicker, /MAX_YEAR/);
  assert.match(monthPicker, /FloatingPanel/);
});

test("Hai tab Khoản thu, Khoản chi dùng lại TransactionsPage, giữ sửa xóa", () => {
  const workspace = read("src/components/finance/TransactionsWorkspace.jsx");
  assert.match(workspace, /Khoản thu/);
  assert.match(workspace, /Khoản chi/);
  assert.match(workspace, /role="tablist"/);
  assert.match(workspace, /aria-selected=/);
  assert.match(workspace, /<TransactionsPage/);
  assert.match(workspace, /onEdit=\{onEdit\}/);
  assert.match(workspace, /onDelete=\{onDelete\}/);
  assert.match(workspace, /key=\{`\$\{type\}:\$\{month\}`\}/);
});

test("Điều hướng cũ từ Tổng quan mở đúng tab và thêm giao dịch theo tab", () => {
  const app = read("src/App.jsx");
  assert.match(app, /nextPage === "income" \|\| nextPage === "expense"/);
  assert.match(app, /setTransactionType\(nextPage\)/);
  assert.match(app, /setPage\("transactions"\)/);
  assert.match(app, /onNavigate=\{navigate\}/);
  assert.match(app, /page === "transactions" && transactionType !== "recurring" \? transactionType : "expense"/);
  assert.match(app, /onTypeChange=\{setTransactionType\}/);
  assert.match(app, /socialToTransaction/);
  assert.match(app, /saveTransaction/);
  assert.match(app, /deleteTransaction/);
  assert.match(read("src/pages/OverviewPage.jsx"), /onNavigate\("income"\)/);
  assert.match(read("src/pages/OverviewPage.jsx"), /onNavigate\("expense"\)/);
});
