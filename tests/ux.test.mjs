import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Đăng nhập không còn chiều cao cố định 780px trên laptop", () => {
  const login = read("src/auth/LoginPage.jsx");
  assert.doesNotMatch(login, /min-h-\[780px\]/);
  assert.match(login, /lg:h-dvh/);
  assert.match(login, /browserLocalPersistence/);
  assert.match(login, /browserSessionPersistence/);
});

test("Form thu chi và sổ mừng cùng dùng hook đóng modal khi chạm backdrop", () => {
  assert.match(read("src/components/finance/TransactionModal.jsx"), /useModalDialog/);
  assert.match(read("src/components/social/SocialEntryModal.jsx"), /useModalDialog/);
  const behavior = read("src/components/common/useModalDialog.js");
  assert.match(behavior, /pointerdown/);
  assert.match(behavior, /getBoundingClientRect/);
  assert.match(behavior, /onCancel/);
});

test("Chọn tháng dùng chung một component cho thanh điều hướng và tổng kết", () => {
  const layout = read("src/components/finance/FinanceLayout.jsx");
  assert.match(layout, /<MonthPicker/);
  assert.match(layout, /\["year", "twelve"\]\.includes\(summaryMode\)/);
  assert.match(layout, /page === "social"/);
  assert.doesNotMatch(layout, /type="month"/);
  assert.doesNotMatch(read("src/pages/SummaryPage.jsx"), /type="month"/);
});

test("Không còn popup danh mục native dài và tắt được bằng click ra ngoài", () => {
  for (const file of ["src/pages/TransactionsPage.jsx", "src/pages/SocialLedgerPage.jsx", "src/components/finance/TransactionModal.jsx", "src/components/social/SocialEntryModal.jsx"]) {
    assert.doesNotMatch(read(file), /<select/);
    assert.match(read(file), /<SmartSelect/);
  }
  assert.match(read("src/components/common/FloatingPanel.jsx"), /document\.addEventListener\("pointerdown"/);
});

test("Các ví dụ placeholder đã được thống nhất và thay tên mẫu", () => {
  const social = read("src/components/social/SocialEntryModal.jsx");
  assert.match(social, /VD: Chí Công/);
  for (const file of ["src/components/social/SocialEntryModal.jsx", "src/pages/BudgetPage.jsx", "src/pages/YearSummaryPage.jsx", "src/components/finance/TransactionModal.jsx"]) {
    assert.doesNotMatch(read(file), /Ví dụ:/);
  }
});

test("Không còn tính năng nhập localStorage cũ; vẫn hỗ trợ sao lưu Firebase", () => {
  const settings = read("src/pages/SettingsPage.jsx");
  assert.doesNotMatch(settings, /Kiểm tra localStorage cũ|Phục hồi từ sao lưu|importBackup/);
  assert.match(settings, /exportBackup/);
  assert.match(read("src/pages/SocialLedgerPage.jsx"), /SocialPeopleTable/);
});
