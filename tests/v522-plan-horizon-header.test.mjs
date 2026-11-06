import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planHorizon, filterPlansByHorizon, groupPlansByHorizon } from "../src/utils/planHorizon.js";
import { validatePlan, planFunding } from "../src/utils/plans.js";
import { filterPlansByPeriod } from "../src/utils/planPeriods.js";
import { buildAnnualSheets } from "../src/utils/annualExcel.js";

const src = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");
const createdAt = new Date("2026-11-06T03:00:00Z").getTime();
const legacy = (id, targetDate) => ({ id, title: id, category: "shopping", targetDate, createdAt, targetAmount: 2_000_000, savedAmount: 0, tasks: [], status: "active" });

test("Phân nhóm ngắn/dài hạn và dữ liệu cũ không cần migration", () => {
  const short = legacy("short", "2027-05-30");
  const long = legacy("long", "2028-04-30");
  const undated = legacy("undated", "");
  const manual = { ...short, horizon: "long" };
  assert.equal(planHorizon(short), "short");
  assert.equal(planHorizon(long), "long");
  assert.equal(planHorizon(undated), "short");
  assert.equal(planHorizon(manual), "long", "User's explicit selection takes priority");
  const plans = [short, long, undated, manual];
  assert.deepEqual(filterPlansByHorizon(plans, "short"), [short, undated]);
  assert.deepEqual(filterPlansByHorizon(plans, "long"), [long, manual]);
  assert.deepEqual(filterPlansByHorizon(plans, "all"), plans);
  const groups = groupPlansByHorizon(plans);
  assert.deepEqual(groups.map((group) => [group.value, group.plans.length]), [["short", 2], ["long", 2]]);
  assert.equal(short.horizon, undefined, "legacy data must not be mutated");
});

test("Tạo/sửa giữ loại kế hoạch và tiền dự tính; không đổi cấu trúc thu chi", () => {
  const old = legacy("wedding", "2027-12-31");
  const clean = validatePlan(old);
  assert.equal(clean.horizon, "long");
  assert.equal(validatePlan({ ...old, horizon: "short" }).horizon, "short");
  assert.throws(() => validatePlan({ ...old, horizon: "other" }), /Loại kế hoạch/);
  assert.equal(planFunding({ ...old, tasks: [{ id: "a", title: "Đầu việc", preparedAmount: 200_000 }] }).prepared, 200_000);
});

test("Kết hợp lọc trạng thái/thời gian và kỳ hạn vẫn không thay đổi kế hoạch gốc", () => {
  const plans = [legacy("nov", "2026-11-22"), { ...legacy("year", "2028-02-15"), horizon: "long" }, legacy("none", "")];
  assert.deepEqual(filterPlansByPeriod(filterPlansByHorizon(plans, "long"), { scope: "year", year: 2028 }).map(({id})=>id), ["year"]);
  assert.deepEqual(filterPlansByPeriod(plans, { scope: "month", month: "2026-11" }).map(({id})=>id), ["nov"]);
});

test("Các lựa chọn lọc dùng SmartSelect; nút Mục tiêu nằm trong header chung", () => {
  const filters = src("components/plans/PlanFilters.jsx");
  const plans = src("pages/PlansPage.jsx");
  const form = src("components/plans/PlanDialog.jsx");
  const app = src("App.jsx");
  const layout = src("components/finance/FinanceLayout.jsx");
  const yearSummary = src("pages/YearSummaryPage.jsx");
  assert.match(filters, /SmartSelect label="Lọc trạng thái kế hoạch"/);
  assert.match(filters, /SmartSelect label="Lọc loại kế hoạch"/);
  assert.match(filters, /SmartSelect label="Lọc thời gian kế hoạch"/);
  assert.doesNotMatch(plans, /role="group" aria-label="Trạng thái kế hoạch"/);
  assert.match(plans, /groupPlansByHorizon/);
  assert.match(form, /Chọn loại kế hoạch/);
  assert.match(app, /setGoalAddSignal/);
  assert.match(layout, /"debts", "summary"/);
  assert.match(yearSummary, /previousAddSignal/);
  assert.match(yearSummary, /YearGoalsDialog/);
  assert.doesNotMatch(yearSummary, /<h2[^>]*>Mục tiêu năm/);
});

test("Excel có nhóm ngắn/dài hạn nhưng số tiền vẫn là VND", () => {
  const data = { collections: { transactions: [], socialEntries: [], budgets: [], plans: [
    { id: "x", data: legacy("x", "2026-12-20") }
  ], yearPlans: [], preferences: [], debts: [] } };
  const sheets = buildAnnualSheets(data, 2026, [], "");
  const plansSheet = sheets.find((item) => item.name === "Kế hoạch");
  assert.ok(plansSheet);
  assert.ok(plansSheet.rows[0].includes("Loại kế hoạch"));
  assert.equal(plansSheet.rows[1][3], "Ngắn hạn");
});
