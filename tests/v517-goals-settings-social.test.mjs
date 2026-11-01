import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyYearGoals } from "../src/utils/yearGoals.js";
import { createYearPlan, isYearPlan, buildYearSummary } from "../src/utils/yearSummary.js";

const source = (file) => readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");

test("Mục tiêu năm áp dụng một tháng và không đổi lịch sử tiết kiệm", () => {
  const old = createYearPlan();
  old[0].savings = 650_000;
  old[0].target = 3_000_000;
  const next = applyYearGoals(old, "month", 2, { target: 5_000_000, savingsTarget: 2_000_000 }, 750_000);
  assert.equal(next[0].savings, 650_000);
  assert.equal(next[0].target, 3_000_000);
  assert.equal(next[1].target, 5_000_000);
  assert.equal(next[1].savingsTarget, 2_000_000);
  assert.equal(next[1].savings, 750_000);
  assert.equal(old[1].target, null);
  assert.ok(isYearPlan(next));
});

test("Áp dụng 12 tháng chỉ thay mục tiêu, không xóa số đã để riêng", () => {
  const old = createYearPlan();
  old[3].savings = 1_100_000;
  old[3].target = 1_000_000;
  const result = applyYearGoals(old, "all", 10, { target: 9_000_000, savingsTarget: 3_000_000 });
  assert.equal(result.length, 12);
  assert.ok(result.every((row) => row.target === 9_000_000 && row.savingsTarget === 3_000_000));
  assert.equal(result[3].savings, 1_100_000);
  assert.equal(old[3].target, 1_000_000);
  assert.equal(buildYearSummary([], 2025, result, new Date(2026, 0, 5)).savingsTarget, 36_000_000);
});

test("Dữ liệu yearPlans cũ vẫn hợp lệ; tiền âm và sai tháng bị từ chối", () => {
  const old = Array.from({length: 12}, () => ({target:null,savings:0}));
  assert.equal(isYearPlan(old), true);
  assert.throws(() => applyYearGoals(old, "month", 13, {target: 1000,savingsTarget:0}), /Tháng/);
  assert.throws(() => applyYearGoals(old, "all", 1, {target:-1,savingsTarget:0}), /Mục tiêu/);
});

test("Header và chỉnh sửa cùng dùng dialog mục tiêu 12 tháng", () => {
  assert.match(source("App.jsx"), /summaryGoalSignal/);
  assert.match(source("App.jsx"), /Thiết lập mục tiêu/);
  assert.match(source("pages/YearSummaryPage.jsx"), /YearGoalsDialog/);
  assert.match(source("components/finance/YearGoalsDialog.jsx"), /Cả 12 tháng/);
  assert.match(source("hooks/useYearPlan.js"), /runTransaction/);
});

test("Cài đặt chia vùng riêng, backup và danh mục giữ nguyên chức năng", () => {
  assert.match(source("pages/SettingsPage.jsx"), /Sao lưu & dữ liệu/);
  assert.match(source("pages/SettingsPage.jsx"), /Danh mục/);
  assert.match(source("components/settings/DataBackupPanel.jsx"), /prepareRestore/);
  assert.match(source("components/settings/DataBackupPanel.jsx"), /downloadAnnualWorkbook/);
});

test("Sổ mừng: 5 người ban đầu, thêm 10, chips co theo chiều rộng và mở chi tiết", () => {
  assert.match(source("pages/SocialLedgerPage.jsx"), /\], 10, 5\)/);
  assert.match(source("components/social/OverflowOccasions.jsx"), /ResizeObserver/);
  assert.match(source("components/social/OverflowOccasions.jsx"), /\+\{hidden\}/);
  assert.match(source("components/social/SocialPeopleTable.jsx"), /onDetails=\{\(\) => onSelect\(person.key\)\}/);
});
