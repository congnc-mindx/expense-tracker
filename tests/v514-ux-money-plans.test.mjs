import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { filterPlansByPeriod } from "../src/utils/planPeriods.js";
import { parseThousandsToVnd, formatVndAsThousands } from "../src/utils/moneyInput.js";
import { formatMoney } from "../src/utils/money.js";
const read = (file) => readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
const plans = [
  { id: "wedding", targetDate: "2027-12-31" },
  { id: "trip", targetDate: "2026-11-21" },
  { id: "home", targetDate: "2026-11-01" },
  { id: "undated", targetDate: "" },
];

test("Chế độ kế hoạch theo tháng và năm không làm đổi dữ liệu gốc", () => {
  assert.deepEqual(filterPlansByPeriod(plans, { scope: "month", month: "2026-11" }).map(p => p.id), ["trip", "home"]);
  assert.deepEqual(filterPlansByPeriod(plans, { scope: "year", year: 2027 }).map(p => p.id), ["wedding"]);
  assert.deepEqual(filterPlansByPeriod(plans, { scope: "all" }), plans);
  assert.equal(plans[0].targetDate, "2027-12-31");
});

test("Nhập theo nghìn nhưng giá trị trình bày luôn đủ đơn vị VND", () => {
  assert.equal(parseThousandsToVnd("50"), 50_000);
  assert.equal(parseThousandsToVnd("1000"), 1_000_000);
  assert.equal(formatMoney(1_000_000), "1.000.000 đ");
  assert.equal(formatVndAsThousands(1_000_000), "1.000");
  const table = read("components/social/SocialPeopleTable.jsx");
  assert.match(table, /formatMoney\(summary\.total\)/);
  assert.match(table, /formatMoney\(item\.amount\)/);
  assert.doesNotMatch(table, /formatThousands\(/);
  assert.doesNotMatch(table, /Đơn vị: 1\.000 đồng/);
});

test("Tổng kết có ba chế độ, bảng 12 tháng tách khỏi biểu đồ năm", () => {
  const summary = read("pages/SummaryPage.jsx");
  const year = read("pages/YearSummaryPage.jsx");
  const layout = read("components/finance/FinanceLayout.jsx");
  assert.match(summary, /onModeChange\("twelve"\)/);
  assert.match(summary, /view=\{mode === "twelve" \? "table" : "analytics"\}/);
  assert.match(year, /view === "table"/);
  assert.match(year, /view !== "table"/);
  assert.match(layout, /\["year", "twelve"\]\.includes\(summaryMode\)/);
});

test("Popup xác nhận kế thừa đúng dark mode từ Layout qua portal", () => {
  assert.match(read("components/finance/FinanceLayout.jsx"), /data-zwhis-theme=\{dark/);
  const confirm = read("components/common/ConfirmProvider.jsx");
  assert.match(confirm, /querySelector\("\[data-zwhis-theme\]"\)/);
  assert.match(confirm, /isDark \? "dark"/);
  assert.match(confirm, /dark:bg-slate-900/);
});

test("Kế hoạch dùng 4 thẻ gọn, lọc kỳ nhưng không đổi schema Firebase", () => {
  const page = read("pages/PlansPage.jsx");
  assert.match(page, /filterPlansByPeriod/);
  assert.match(page, /Theo tháng/);
  assert.match(page, /Theo năm/);
  assert.match(page, /!p-3 sm:!p-4/);
});
