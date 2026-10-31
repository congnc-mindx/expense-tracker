import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { filteredPlans, planDeadline, planProgress, planTasksProgress, validatePlan } from "../src/utils/plans.js";
import { formatVndAsThousands, parseThousandsToVnd } from "../src/utils/moneyInput.js";

const dirnameHere = dirname(fileURLToPath(import.meta.url));
const src = (file) => readFileSync(resolve(dirnameHere, "../src", file), "utf8");
const valid = { title: "Mua máy giặt", category: "home", targetAmount: 5_000_000, savedAmount: 1_500_000, targetDate: "2027-05-10", note: "", tasks: [{ id: "a", title: "Chọn mẫu", done: false }], status: "active" };

test("Kế hoạch xác thực đầy đủ dữ liệu, không nhập tiền âm", () => {
  assert.equal(validatePlan(valid).targetAmount, 5_000_000);
  assert.throws(() => validatePlan({ ...valid, title: " " }), /Tên kế hoạch/);
  assert.throws(() => validatePlan({ ...valid, targetAmount: 0 }), /mục tiêu/);
  assert.throws(() => validatePlan({ ...valid, savedAmount: -10 }), /đã chuẩn bị/);
  assert.throws(() => validatePlan({ ...valid, targetDate: "2026-02-31" }), /Ngày dự kiến/);
  assert.throws(() => validatePlan({ ...valid, tasks: [{ id: "a", title: "" }] }), /Checklist/);
  assert.throws(() => validatePlan({ ...valid, tasks: [{ id: "a", title: "Mua" }, { id: "a", title: "Sắm" }] }), /Checklist/);
});

test("Đổi giá trị từ nghìn đồng khi tạo/sửa mà không nhân đôi", () => {
  assert.equal(parseThousandsToVnd("355"), 355_000);
  assert.equal(parseThousandsToVnd(formatVndAsThousands(5_000_000)), 5_000_000);
  assert.equal(parseThousandsToVnd(formatVndAsThousands(0), { allowZero: true }), 0);
});

test("Tiến độ tiền chuẩn bị được chặn ở chiều rộng 100%, không tự hoàn thành", () => {
  assert.deepEqual(planProgress(valid), { percentage: 30, width: 30, remaining: 3_500_000, prepared: 1_500_000 });
  assert.deepEqual(planProgress({ targetAmount: 1_000_000, savedAmount: 2_000_000 }), { percentage: 200, width: 100, remaining: 0, prepared: 2_000_000 });
  assert.deepEqual(planTasksProgress(valid), { done: 0, total: 1 });
});

test("Hạn dự kiến nhận biết quá hạn, đúng ngày, tương lai và kế hoạch hoàn thành", () => {
  assert.equal(planDeadline(valid, "2027-05-11"), "overdue");
  assert.equal(planDeadline(valid, "2027-05-10"), "today");
  assert.equal(planDeadline(valid, "2027-05-09"), "upcoming");
  assert.equal(planDeadline({ ...valid, status: "completed" }, "2030-01-01"), "completed");
  assert.equal(planDeadline({ ...valid, targetDate: "" }, "2027-05-11"), "none");
});

test("Tìm kiếm bỏ dấu và lọc hoàn thành", () => {
  const docs = [{ ...valid, id: "1", title: "Mua máy giặt" }, { ...valid, id: "2", title: "Đám cưới", category: "wedding", status: "completed" }];
  assert.deepEqual(filteredPlans(docs, { query: "may giat", filter: "all" }).map((p) => p.id), ["1"]);
  assert.deepEqual(filteredPlans(docs, { query: "cuoi", filter: "completed" }).map((p) => p.id), ["2"]);
  assert.deepEqual(filteredPlans(docs, { filter: "active" }).map((p) => p.id), ["1"]);
});

test("Điều hướng, backup và Firebase được nối đúng, không cộng plans vào giao dịch", () => {
  const app = src("App.jsx");
  const layout = src("components/finance/FinanceLayout.jsx");
  assert.match(app, /useCloudCollection\(user.uid, "plans"\)/);
  assert.match(app, /<PlansPage store=\{plansStore\}/);
  assert.match(layout, /\["plans", "Kế hoạch"/);
  assert.match(src("firebase/backup.js"), /"plans"/);
  assert.match(app, /\[\.\.\.transactions, \.\.\.socialStore.rows\.map\(socialToTransaction\)\]/);
  assert.doesNotMatch(app, /\.\.\.plansStore\.rows/);
});

test("Bấm hoàn thành chỉ bật lời chúc sau khi save thành công; có sửa và xóa kế hoạch", () => {
  const page = src("pages/PlansPage.jsx");
  assert.match(page, /await store\.save\(documentId/);
  assert.match(page, /if \(checked\) setCelebration/);
  assert.match(page, /await store\.remove\(plan\.id\)/);
  assert.match(page, /window\.confirm\(/);
  const dialog = src("components/plans/PlanDialog.jsx");
  assert.match(dialog, /validatePlan\(/);
  assert.match(dialog, /formatVndAsThousands/);
});
