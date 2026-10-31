import test from "node:test";
import assert from "node:assert/strict";
import { getBudgetProgress } from "../src/utils/budgetProgress.js";

test("Màu tiến độ ngân sách tại mốc 0, 50, 80, 100 và vượt hạn mức", () => {
  const cases = [
    [0, "green"], [50, "green"], [50.001, "yellow"],
    [80, "yellow"], [80.001, "red"], [89, "red"],
    [100, "red"], [110, "red"],
  ];
  for (const [percent, expected] of cases) {
    const result = getBudgetProgress(percent * 10_000, 1_000_000);
    assert.equal(result.tone, expected, `Mức ${percent}% phải là ${expected}`);
    assert.ok(result.textClass && result.barClass && result.badgeClass);
  }
  assert.equal(getBudgetProgress(1_100_000, 1_000_000).label, "Vượt hạn mức");
});

test("Không đặt ngân sách là trạng thái trung tính", () => {
  assert.equal(getBudgetProgress(200_000, 0).tone, "neutral");
  assert.equal(getBudgetProgress(200_000, 0).percentage, 0);
});

test("Form giữ nguyên các trường nhập tiền, ghi chú và nguồn lưu VND", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { resolve } = await import("node:path");
  const source = readFileSync(resolve(fileURLToPath(new URL("..", import.meta.url)), "src/components/finance/TransactionModal.jsx"), "utf8");
  assert.match(source, /parseThousandsToVnd\(amountText\)/);
  assert.match(source, /status: "actual"/);
  assert.match(source, /placeholder="0"/);
  assert.doesNotMatch(source, /transaction-amount-preview/);
  assert.match(source, /placeholder="Nội dung giao dịch, nguồn thu…"/);
  assert.match(source, /flex flex-wrap items-baseline gap-x-1\.5/);
});
