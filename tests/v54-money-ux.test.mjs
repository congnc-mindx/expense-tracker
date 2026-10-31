import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseThousandsToVnd, formatVndAsThousands } from "../src/utils/moneyInput.js";
import { parseSocialThousands, toSocialThousands } from "../src/utils/socialMoney.js";
import { isActual } from "../src/utils/finance.js";
const source = (file) => readFileSync(new URL(file, import.meta.url), "utf8");

test("Nhập nghìn đồng được lưu thành đúng VND", () => {
  assert.equal(parseThousandsToVnd("355"), 355_000);
  assert.equal(parseThousandsToVnd("2000"), 2_000_000);
  assert.equal(parseThousandsToVnd("2.000"), 2_000_000);
  assert.equal(parseThousandsToVnd("355,5"), 355_500);
  assert.equal(parseThousandsToVnd("0"), NaN);
  assert.equal(parseThousandsToVnd("0", { allowZero: true }), 0);
  assert.ok(Number.isNaN(parseThousandsToVnd("35.50")));
  assert.ok(Number.isNaN(parseThousandsToVnd("999999999999999999999")));
});

test("Mở sửa khoản cũ không nhân thêm 1.000 lần", () => {
  for (const amount of [355_000, 2_000_000, 355_500, 1_234_567, 150_000_000]) {
    assert.equal(parseThousandsToVnd(formatVndAsThousands(amount)), amount);
  }
});

test("Sổ mừng dùng đúng cùng một quy tắc nghìn đồng", () => {
  assert.equal(parseSocialThousands("355"), 355_000);
  assert.equal(parseSocialThousands("2.000"), 2_000_000);
  assert.equal(parseSocialThousands(toSocialThousands(355_500)), 355_500);
});

test("Ngày tương lai không tính là giao dịch thực tế", () => {
  assert.equal(isActual({ date: "2026-11-02", status: "actual" }, "2026-10-31"), false);
  assert.equal(isActual({ date: "2026-10-30", status: "actual" }, "2026-10-31"), true);
  assert.equal(isActual({ date: "2026-10-30", status: "planned" }, "2026-10-31"), false);
});

test("Modal bỏ trạng thái và nguồn thu, giữ danh mục và ngày trên cùng hàng", () => {
  const text = source("../src/components/finance/TransactionModal.jsx");
  assert.match(text, /gap-3 sm:grid-cols-2/);
  assert.match(text, /<SmartSelect label="Danh mục"/);
  assert.match(text, /<DatePicker label="Ngày giao dịch"/);
  assert.doesNotMatch(text, /Nguồn thu|<SmartSelect label="Trạng thái"/);
  assert.match(text, /SUGGESTED_AMOUNTS = \[50, 100, 200, 500\]/);
  assert.match(text, /status: "actual"/);
  assert.match(text, /max-h-\[94dvh\]/);
});

test("Lịch dùng chung không còn ô số năm native và không bị cắt trong dialog", () => {
  const text = source("../src/components/common/DatePicker.jsx");
  assert.doesNotMatch(text, /type="number"/);
  assert.match(text, /screen === "years"/);
  assert.match(text, /screen === "months"/);
  assert.match(text, /MIN_YEAR/);
  assert.match(source("../src/components/finance/TransactionModal.jsx"), /overflow-visible/);
  assert.match(source("../src/components/social/SocialEntryModal.jsx"), /overflow-visible/);
});

test("Budget và kế hoạch năm cũng dùng input theo nghìn đồng", () => {
  assert.match(source("../src/components/budget/BudgetLimitDialog.jsx"), /parseThousandsToVnd/);
  assert.match(source("../src/components/budget/BudgetLimitDialog.jsx"), /formatVndAsThousands/);
  assert.match(source("../src/pages/YearSummaryPage.jsx"), /parseThousandsToVnd/);
});
