import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { goalProgressForYear } from "../src/utils/yearGoals.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Tổng kết Mục tiêu dùng popup mục tiêu, không hiện nút thêm giao dịch", () => {
  const layout = read("src/components/finance/FinanceLayout.jsx");
  const app = read("src/App.jsx");
  assert.match(layout, /"debts", "summary"/);
  assert.match(app, /summaryMode === "twelve" \? "\+ Thiết lập mục tiêu"/);
  assert.match(app, /setGoalAddSignal/);
  assert.doesNotMatch(read("src/pages/SettingsPage.jsx"), /yearGoals/);
  assert.match(read("src/pages/YearSummaryPage.jsx"), /YearGoalsDialog/);
  assert.match(read("src/pages/YearSummaryPage.jsx"), /goalProgressForYear/);
});

test("Mục tiêu và phân tích năm dùng cùng nguồn tổng hợp, không nhân bản sang Cài đặt", () => {
  const app = read("src/App.jsx");
  const summary = read("src/pages/SummaryPage.jsx");
  const year = read("src/pages/YearSummaryPage.jsx");
  assert.match(app, /<SummaryPage transactions=\{combinedTransactions\}/);
  assert.match(summary, /transactions=\{transactions\.filter/);
  assert.match(year, /buildYearSummary\(transactions, year, plan\)/);
  assert.doesNotMatch(read("src/pages/SettingsPage.jsx"), /summaryTransactions/);
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
