import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isActual, totals } from "../src/utils/finance.js";
import { automaticRecurringExpenses } from "../src/utils/automaticLedger.js";
import { recurringForMonth } from "../src/utils/recurringExpenses.js";
import { mindxSalaryTransactions, legacyMindxReceiptsExcluded } from "../src/integrations/mindx/projection.js";
import { validateBackup } from "../src/utils/backupValidation.js";
import { buildAnnualSheets } from "../src/utils/annualExcel.js";

const recurring = { id: "rent", title: "Tiền nhà", type: "expense", amount: 2_000_000, category: "food", day: 30, startMonth: "2026-10", endMonth: "", active: true };
const salary = (amount) => ({ period: "2026-10", expectedIncome: amount, confirmedWork: 0, waitingWork: 0 });
const snapshot = {
  app: "zWhisFlow", version: 2, exportedAt: "2026-11-01T12:00:00.000Z",
  collections: { transactions: [], budgets: [], plans: [], socialEntries: [], yearPlans: [], preferences: [
    { id: "recurringExpenses", items: [recurring] },
  ] },
};

test("Đến đầu tháng, chi dự kiến tự trừ dù ngày chi trong tháng chưa đến; không tính tương lai", () => {
  assert.equal(isActual({ type: "expense", status: "planned", date: "2026-11-30" }, "2026-11-01"), true);
  assert.equal(isActual({ type: "expense", status: "planned", date: "2026-12-01" }, "2026-11-01"), false);
  assert.equal(isActual({ type: "income", status: "planned", date: "2026-11-01" }, "2026-11-01"), false);
  assert.equal(isActual({ type: "expense", status: "actual", origin: "social", date: "2026-11-30" }, "2026-11-01"), false);
});

test("Dòng chi lặp tự tính duy nhất một lần mỗi tháng, không tạo giao dịch trùng", () => {
  const first = automaticRecurringExpenses([recurring], [], "2026-11-01", 2026);
  assert.equal(first.length, 2);
  assert.deepEqual(first.map((row) => row.date), ["2026-10-30", "2026-11-30"]);
  assert.equal(totals(first).expense, 4_000_000);
  const alreadyRecorded = [{ id: "recurring_rent_2026-10" }];
  const second = automaticRecurringExpenses([recurring], alreadyRecorded, "2026-11-01", 2026);
  assert.equal(second.length, 1);
  assert.equal(second[0].recurringMonth, "2026-11");
});

test("Lịch định kỳ giữ kỳ cũ sau khi chỉnh hoặc dừng ở kỳ mới", () => {
  const modified = {
    ...recurring, startMonth: "2026-11", amount: 3_000_000, active: false,
    history: [{ ...recurring, endMonth: "2026-10" }],
  };
  assert.equal(recurringForMonth([modified], "2026-10", [])[0].amount, 2_000_000);
  assert.equal(recurringForMonth([modified], "2026-11", []).length, 0);
});

test("Lương mindX lấy đúng tháng công việc, realtime thay đổi không nhân đôi; hóa đơn cũ tránh đếm trùng", () => {
  const rows = mindxSalaryTransactions([salary(12_160_000)], "uid", [], "mindx", "2026-11-01");
  assert.equal(rows[0].date, "2026-10-01");
  assert.equal(rows[0].amount, 12_160_000);
  assert.equal(rows[0].status, "actual");
  assert.equal(mindxSalaryTransactions([salary(15_000_000)], "uid", [], "mindx", "2026-11-01")[0].amount, 15_000_000);
  const receipt = { id: "mindx-uid-2026-10", type: "income", mindxPeriod: "2026-10", mindxSourceUid: "uid", amount: 12_000_000, date: "2026-11-20" };
  assert.equal(legacyMindxReceiptsExcluded([receipt], [salary(15_000_000)], "uid").length, 0);
  assert.equal(legacyMindxReceiptsExcluded([receipt], [], "uid").length, 1);
});

test("Bản JSON hợp lệ được kiểm tra 6 collection, ID trùng hoặc kiểu sai bị chặn", () => {
  const validated = validateBackup(snapshot);
  assert.equal(validated.count, 1);
  assert.equal(validated.collections.preferences[0].id, "recurringExpenses");
  assert.throws(() => validateBackup({ ...snapshot, app: "unknown" }));
  assert.throws(() => validateBackup({ ...snapshot, collections: { ...snapshot.collections, preferences: [{ id: "same" }, { id: "same" }] } }));
  assert.throws(() => validateBackup({ ...snapshot, collections: { ...snapshot.collections, transactions: [{ id: "bad/id" }] } }));
});

test("Xuất Excel thống nhất với thu nhập mindX và chi định kỳ tự tính", () => {
  const sheets = buildAnnualSheets(snapshot, 2026, [salary(12_160_000)], "uid");
  const yearly = sheets.find((sheet) => sheet.name === "Tổng hợp 12 tháng").rows;
  const october = yearly[3 + 9];
  const november = yearly[3 + 10];
  assert.equal(october[1].value, 12_160_000);
  assert.equal(october[2].value, 2_000_000);
  assert.equal(november[2].value, 2_000_000);
  const movements = sheets.find((sheet) => sheet.name === "Giao dịch").rows;
  assert.ok(movements.some((row) => row[0] === "mindx-projection-uid-2026-10"));
  assert.ok(movements.some((row) => row[0] === "recurring_rent_2026-10"));
});

test("Cài đặt: chỉ 5 năm, có khôi phục JSON, đã bỏ tài khoản & giao diện", () => {
  const settings = readFileSync(new URL("../src/pages/SettingsPage.jsx", import.meta.url), "utf8");
  assert.match(settings, /DataBackupPanel/);
  const backup = readFileSync(new URL("../src/components/settings/DataBackupPanel.jsx", import.meta.url), "utf8");
  assert.match(backup, /length: 5/);
  assert.match(backup, /validateBackup/);
  assert.match(backup, /applyRestore/);
  assert.doesNotMatch(settings, /Tài khoản & giao diện/);
  const workspace = readFileSync(new URL("../src/components/finance/TransactionsWorkspace.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(workspace, /MindxIncomePanel/);
});
