import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MINDX_SYNC_START_PERIOD, inMindxSyncWindow } from "../src/integrations/mindx/periods.js";
import { mindxSalaryTransactions, legacyMindxReceiptsExcluded } from "../src/integrations/mindx/projection.js";
import { buildAnnualSheets } from "../src/utils/annualExcel.js";

const source = (filename) => readFileSync(new URL(`../src/${filename}`, import.meta.url), "utf8");
const salary = (period, amount) => ({ period, expectedIncome: amount, confirmedWork: 0, waitingWork: 0 });

// The salary stream is always keyed to the work month, never the payment date.
test("Lương mindX chỉ bắt đầu từ kỳ 11/2026, giữ đúng tháng công việc", () => {
  assert.equal(MINDX_SYNC_START_PERIOD, "2026-11");
  assert.equal(inMindxSyncWindow("2026-10"), false);
  assert.equal(inMindxSyncWindow("2026-11"), true);
  assert.equal(inMindxSyncWindow("2026-12"), true);
  assert.equal(inMindxSyncWindow("2027-01"), true);
  const projections = mindxSalaryTransactions([salary("2026-10", 5_000_000), salary("2026-11", 7_000_000), salary("2026-12", 8_000_000)], "salary-user", [], "mindx", "2026-11-15");
  assert.equal(projections.length, 2);
  assert.deepEqual(projections.map((row) => row.date), ["2026-11-01", "2026-12-01"]);
  assert.deepEqual(projections.map((row) => row.amount), [7_000_000, 8_000_000]);
  assert.deepEqual(projections.map((row) => row.status), ["actual", "planned"]);
  assert.equal(projections[0].origin, "mindx");
});

test("Không xóa giao dịch mindX đã nhận của tháng 10; ngăn trùng tháng 11", () => {
  const manualOctober = { id: "mindx-salary-user-2026-10", mindxPeriod: "2026-10", mindxSourceUid: "salary-user", amount: 5_000_000 };
  const manualNovember = { id: "mindx-salary-user-2026-11", mindxPeriod: "2026-11", mindxSourceUid: "salary-user", amount: 7_000_000 };
  const unrelated = { id: "income-another-source", amount: 3_000_000 };
  const results = legacyMindxReceiptsExcluded([manualOctober, manualNovember, unrelated], [salary("2026-10", 5_000_000), salary("2026-11", 7_000_000)], "salary-user");
  assert.deepEqual(results.map((row) => row.id), [manualOctober.id, unrelated.id]);
});

test("File Excel cũng không ghi lương đồng bộ trước kỳ 11/2026", () => {
  const empty = { collections: { transactions: [], socialEntries: [], budgets: [], plans: [], yearPlans: [], preferences: [], debts: [] } };
  const sheets = buildAnnualSheets(empty, 2026, [salary("2026-10", 5_000_000), salary("2026-11", 7_000_000)], "salary-user");
  const salarySheet = sheets.find((sheet) => sheet.name === "Lương mindX");
  assert.deepEqual(salarySheet.rows.slice(1).map((row) => row[0]), ["2026-11"]);
  const annual = sheets.find((sheet) => sheet.name === "Tổng hợp 12 tháng").rows;
  assert.equal(annual[12][1].value, 0); // Oct: index 3 + 9
  assert.equal(annual[13][1].value, 7_000_000); // Nov: index 3 + 10
});

test("Sổ nợ dùng bộ lọc chiều SmartSelect thay vì ba nút cố định", () => {
  const page = source("pages/DebtsPage.jsx");
  assert.match(page, /SmartSelect label="Lọc chiều khoản nợ" value=\{direction\}/);
  assert.match(page, /SmartSelect label="Lọc trạng thái nợ"/);
  assert.doesNotMatch(page, /role="group" aria-label="Chiều khoản nợ"/);
});

test("Sidebar bỏ Đồng bộ Firebase, Tổng kết có tab Mục tiêu và popup chỉnh theo tháng", () => {
  const layout = source("components/finance/FinanceLayout.jsx");
  const summary = source("pages/SummaryPage.jsx");
  const year = source("pages/YearSummaryPage.jsx");
  const settings = source("pages/SettingsPage.jsx");
  assert.doesNotMatch(layout, /Đồng bộ Firebase/);
  assert.match(layout, /\{user\?\.email\}/);
  assert.match(summary, /Mục tiêu/);
  assert.match(year, /YearGoalsDialog/);
  assert.match(year, /onClick=\{\(\) => setEditingMonth\(row\.month\)\}/);
  assert.match(year, /onSave=\{saveGoals\}/);
  assert.doesNotMatch(settings, /YearGoalsSettingsPanel|Mục tiêu năm/);
  assert.match(source("hooks/useYearPlan.js"), /runTransaction/);
});
