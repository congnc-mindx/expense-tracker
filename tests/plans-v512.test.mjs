import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planFunding, planProgress, validatePlan } from "../src/utils/plans.js";
import { parseThousandsToVnd, formatVndAsThousands } from "../src/utils/moneyInput.js";
const read = (name) => readFileSync(new URL(`../src/${name}`, import.meta.url), "utf8");
const original = {
  title: "Chuẩn bị đám cưới", category: "wedding", targetDate: "2027-12-31",
  targetAmount: 200_000_000, savedAmount: 5_000_000, note: "", status: "active",
  tasks: [{ id: "one", title: "Ảnh cưới", done: false }, { id: "two", title: "Váy cưới", done: false }],
};

test("Kế hoạch cũ không có trường tiền trong checklist vẫn mở và lưu được", () => {
  const parsed = validatePlan(original);
  assert.equal(parsed.savedAmount, 5_000_000);
  assert.deepEqual(parsed.tasks.map((task) => [task.estimatedAmount, task.preparedAmount]), [[0, 0], [0, 0]]);
  assert.equal(planProgress(original).prepared, 5_000_000);
});

test("Mỗi đầu việc có tiền dự kiến và tiền chuẩn bị, không cộng khi chỉ tích hoàn thành", () => {
  const plans = { ...original, tasks: [
    { id: "one", title: "Ảnh cưới", done: false, estimatedAmount: 12_000_000, preparedAmount: 2_000_000 },
    { id: "two", title: "Váy cưới", done: true, estimatedAmount: 15_000_000, preparedAmount: 3_000_000 },
  ] };
  assert.deepEqual(planFunding(plans), { allocated: 5_000_000, unallocated: 5_000_000, prepared: 10_000_000, estimated: 27_000_000 });
  assert.equal(planProgress(plans).percentage, 5);
  assert.equal(planFunding({ ...plans, tasks: plans.tasks.map((task) => ({ ...task, done: true })) }).prepared, 10_000_000);
  assert.deepEqual(validatePlan(plans).tasks.map((task) => task.preparedAmount), [2_000_000, 3_000_000]);
});

test("Tiền trong đầu việc giữ nghìn đồng khi nhập và mở sửa", () => {
  assert.equal(parseThousandsToVnd("1000"), 1_000_000);
  assert.equal(parseThousandsToVnd(formatVndAsThousands(1_000_000)), 1_000_000);
  assert.equal(parseThousandsToVnd(formatVndAsThousands(3_550_000)), 3_550_000);
});

test("Chi phí đầu việc âm, thập phân VND và vượt giới hạn bị từ chối", () => {
  assert.throws(() => validatePlan({ ...original, tasks: [{ id: "x", title: "A", estimatedAmount: -1 }] }), /Chi phí/);
  assert.throws(() => validatePlan({ ...original, tasks: [{ id: "x", title: "A", preparedAmount: 0.5 }] }), /Chi phí/);
});

test("Bộ chọn tháng/năm dùng hai tab riêng và không còn spinner số", () => {
  const month = read("components/common/MonthPicker.jsx");
  const year = read("components/common/YearGrid.jsx");
  const date = read("components/common/DatePicker.jsx");
  assert.match(month, /role="tablist"/);
  assert.match(month, /setMode\("years"\)/);
  for (const file of [month, year, date]) assert.doesNotMatch(file, /type="number"/);
});

test("Tạo kế hoạch lên header, xem trực tiếp qua dialog và tích hoàn thành trong card", () => {
  const app = read("App.jsx");
  const layout = read("components/finance/FinanceLayout.jsx");
  const page = read("pages/PlansPage.jsx");
  const detail = read("components/plans/PlanDetailsDialog.jsx");
  assert.match(app, /planAddSignal/);
  assert.match(layout, /"plans"\].includes\(page\)/);
  assert.match(page, /<PlanDetailsDialog/);
  assert.match(page, /Xem chi tiết/);
  assert.match(page, /Tổng chi phí đã chuẩn bị/);
  assert.match(detail, /onToggleTask/);
  assert.match(detail, /Sửa kế hoạch/);
});
