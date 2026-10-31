import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aggregatePeople } from "../src/utils/social.js";
import { filterSocialPeople, socialDirectionSummary } from "../src/utils/socialView.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const entries = [
  { id: "1", personName: "Hiền Anh", group: "Cấp 2", direction: "given", occasion: "newborn", amount: 200_000, date: "2026-10-31" },
  { id: "2", personName: "Hiền Anh", group: "Cấp 2", direction: "received", occasion: "wedding", amount: 500_000, date: "2026-10-29" },
  { id: "3", personName: "Hiền Anh", group: "Cấp 2", direction: "given", occasion: "wedding", amount: 1_000_000, date: "2026-10-24" },
  { id: "4", personName: "Lê Trung", group: "Cấp 3", direction: "given", occasion: "wedding", amount: 2_000_000, date: "2026-10-21" },
];
const people = aggregatePeople(entries);

test("Bộ lọc người/nhóm/dịp giữ nguyên hai chiều, không lọc nhầm", () => {
  assert.equal(filterSocialPeople(people, { search: "hien anh" }).length, 1);
  assert.equal(filterSocialPeople(people, { group: "Cấp 2", occasion: "wedding" }).length, 1);
  assert.equal(filterSocialPeople(people, { occasion: "newborn" }).length, 1);
  assert.equal(filterSocialPeople(people, { occasion: "hospital" }).length, 0);
  const selected = filterSocialPeople(people, { group: "Cấp 2" })[0];
  assert.equal(selected.given, 1_200_000);
  assert.equal(selected.received, 500_000);
});

test("Tổng hợp Mình gửi / Họ gửi chính xác theo dịp và không cộng trùng", () => {
  const given = socialDirectionSummary(entries, "given");
  assert.equal(given.total, 3_200_000);
  assert.equal(given.count, 3);
  assert.equal(given.occasions.find((row) => row.id === "newborn")?.amount, 200_000);
  const received = socialDirectionSummary(entries, "received");
  assert.equal(received.total, 500_000);
  assert.deepEqual(received.occasions.map((row) => row.id), ["wedding"]);
  assert.equal(socialDirectionSummary(entries, "given", "wedding").total, 3_000_000);
  assert.equal(socialDirectionSummary(entries, "received", "newborn").total, 0);
});

test("Trang Sổ mừng có bộ lọc thiết thực và lối sửa/xóa rõ ràng", () => {
  const page = read("src/pages/SocialLedgerPage.jsx");
  const table = read("src/components/social/SocialPeopleTable.jsx");
  const history = read("src/components/social/SocialHistoryDialog.jsx");
  assert.doesNotMatch(page, /directionFilter|label="Chiều"/);
  assert.match(page, /filterSocialPeople/);
  assert.match(page, /<SocialHistoryDialog/);
  assert.match(table, /Xem \/ Sửa/);
  assert.match(table, /DirectionSummary/);
  assert.doesNotMatch(table, /table-fixed.*text-\[11px\]/);
  assert.match(history, /onEdit\(entry\)/);
  assert.match(history, /onDelete\(id\)/);
  assert.match(history, /Xác nhận xóa/);
  assert.match(page, /await store\.remove\(id\)/);
});

test("Popup thu chi vừa mắt, số tiền và ghi chú giữ logic hiện tại", () => {
  const source = read("src/components/finance/TransactionModal.jsx");
  assert.match(source, /max-w-\[610px\]/);
  assert.match(source, /placeholder="0"/);
  assert.doesNotMatch(source, /transaction-amount-preview/);
  assert.match(source, /parseThousandsToVnd\(amountText\)/);
  assert.match(source, /formatVndAsThousands\(transaction\.amount\)/);
  assert.match(source, /placeholder="Nội dung giao dịch, nguồn thu…"/);
  assert.match(source, /status: "actual"/);
});
