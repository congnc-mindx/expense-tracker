import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { goalProgressForYear } from "../src/utils/yearGoals.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Tổng kết 12 tháng không hiển thị nút thêm giao dịch và đặt mục tiêu chuyển về Cài đặt", () => {
  const layout = read("src/components/finance/FinanceLayout.jsx");
  const app = read("src/App.jsx");
  assert.match(layout, /summaryMode !== "twelve"/);
  assert.doesNotMatch(app, /summaryGoalSignal/);
  assert.match(read("src/pages/SettingsPage.jsx"), /yearGoals/);
  assert.match(read("src/pages/YearSummaryPage.jsx"), /goalProgressForYear/);
});

test("Mục tiêu năm nhận sổ mừng + lương mindX + định kỳ như Tổng kết", () => {
  const app = read("src/App.jsx");
  const settings = read("src/pages/SettingsPage.jsx");
  assert.match(app, /summaryTransactions=\{combinedTransactions\}/);
  assert.match(settings, /transactions=\{summaryTransactions\}/);
});

test("Phân tích 12 tháng chỉ tính mục tiêu đã đến kỳ, không trừ tương lai", () => {
  const rows = [
    { target: 1_000_000, income: 1_200_000, savingsTarget: 500_000, savings: 250_000, future: false },
    { target: 1_000_000, income: 0, savingsTarget: 500_000, savings: 0, future: false },
    { target: 10_000_000, income: 0, savingsTarget: 8_000_000, savings: 0, future: true },
  ];
  const actual = goalProgressForYear(rows);
  assert.equal(actual.defined, 3);
  assert.equal(actual.eligible, 2);
  assert.equal(actual.reached, 1);
  assert.equal(actual.incomeProgress, "60%");
  assert.equal(actual.savingsProgress, "25%");
  assert.equal(goalProgressForYear([]).incomeProgress, "Chưa đặt");
});

test("Sổ mừng cho click toàn bộ dòng, giữ màu vàng/xanh tương thích sáng tối", () => {
  const table = read("src/components/social/SocialPeopleTable.jsx");
  const history = read("src/components/social/SocialHistoryDialog.jsx");
  const chips = read("src/components/social/OverflowOccasions.jsx");
  assert.match(table, /onClick=\{\(\) => onSelect\(person.key\)\}/);
  assert.match(table, /dark:text-amber-400/);
  assert.match(table, /dark:text-emerald-400/);
  assert.doesNotMatch(table, /Xem \/ Sửa/);
  assert.match(history, /bg-amber-50/);
  assert.match(chips, /ResizeObserver/);
});

test("Xuất Excel dùng SmartSelect tối đa 5 năm", () => {
  const panel = read("src/components/settings/DataBackupPanel.jsx");
  assert.match(panel, /SmartSelect/);
  assert.match(panel, /length: 5/);
  assert.doesNotMatch(panel, /<select/);
});
