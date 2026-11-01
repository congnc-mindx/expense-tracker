import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildAnnualSheets, buildAnnualWorkbook } from "../src/utils/annualExcel.js";
import { mindxPaymentId, validSalaryPeriod } from "../src/integrations/mindx/periods.js";

const fixture = {
  collections: {
    transactions: [
      { id: "payment", date: "2026-04-03", type: "income", status: "actual", amount: 355000, category: "mindx" },
      { id: "future", date: "2091-12-01", type: "income", status: "planned", amount: 50000000, category: "mindx" },
    ],
    socialEntries: [{ id: "social-1", date: "2026-04-04", direction: "given", amount: 1000000, personName: "Bạn A", occasion: "wedding", group: "Bạn" }],
    budgets: [{ id: "2026-03", total: 10000000, categories: { food: 1000000 } }, { id: "2026-05", total: 15000000, categories: { food: 2000000 } }],
    yearPlans: [], plans: [], preferences: [],
  },
};

test("Tổng hợp Excel gồm cả Sổ mừng, không cộng tiền tương lai", () => {
  const sheets = buildAnnualSheets(fixture, 2026);
  const overview = sheets.find((sheet) => sheet.name === "Tổng hợp 12 tháng");
  assert.equal(overview.rows[6][1].value, 355000);
  assert.equal(overview.rows[6][2].value, 1000000);
  assert.equal(overview.rows[6][3].value, -645000);
  const budget = sheets.find((sheet) => sheet.name === "Ngân sách").rows;
  assert.equal(budget.find((row) => row[0] === "2026-04")[4].value, 1000000);
  assert.equal(budget.find((row) => row[0] === "2026-06")[4].value, 2000000);
  assert.ok(sheets.some((sheet) => sheet.name === "Lương mindX"));
});

test("XLSX tạo được ZIP chuẩn với Workbook, Styles, Sheet và số tiền VND", () => {
  const bytes = buildAnnualWorkbook(fixture, 2026, [{ period: "2026-04", expectedIncome: 5500000, confirmedWork: 3000000, waitingWork: 2500000 }]);
  assert.equal(bytes[0], 0x50); assert.equal(bytes[1], 0x4B);
  const text = new TextDecoder().decode(bytes);
  assert.match(text, /Tổng hợp 12 tháng/);
  assert.match(text, /5500000/);
  assert.match(text, /355000/);
});

test("Mỗi kỳ mindX có mã cố định và lương dự kiến chỉ hiện 1 lần", () => {
  assert.equal(mindxPaymentId("uid-123", "2026-04"), "mindx-uid-123-2026-04");
  assert.throws(() => mindxPaymentId("uid", "2026-13"));
  assert.equal(validSalaryPeriod({period:"2026-04",expectedIncome:355000,confirmedWork:200000,waitingWork:155000}), true);
  const source = readFileSync("src/integrations/mindx/recordSalaryPayment.js", "utf8");
  assert.match(source, /runTransaction/);
  assert.match(source, /prior\.exists\(\)/);
  assert.match(source, /status: "actual"/);
});
