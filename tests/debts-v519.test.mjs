import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  validateDebt, withDebtPayment, withoutDebtPayment, debtStatus, debtOverview,
  paidDebtAmount, outstandingDebtAmount, filterDebts, debtBalanceAt,
} from "../src/utils/debts.js";
import { parseThousandsToVnd, formatVndAsThousands } from "../src/utils/moneyInput.js";
import { validateBackup } from "../src/utils/backupValidation.js";
import { buildAnnualSheets } from "../src/utils/annualExcel.js";

const source = (file) => readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
const base = () => ({ direction: "receivable", person: "Minh Anh", amount: 2_000_000, date: "2026-08-01", dueDate: "2026-12-01", note: "", payments: [] });
const payment = (id, amount, date = "2026-09-10") => ({ id, amount, date, note: "Chuyển khoản" });
const emptyBackup = () => ({ app: "zWhisFlow", version: 2, collections: {
  transactions: [], budgets: [], yearPlans: [], socialEntries: [], plans: [], preferences: [],
} });

test("Ghi nợ hai chiều, nhập theo nghìn và giữ số tiền gốc VND", () => {
  const amount = parseThousandsToVnd("1000");
  assert.equal(amount, 1_000_000);
  assert.equal(formatVndAsThousands(amount), "1.000");
  assert.equal(validateDebt({ ...base(), amount }).amount, 1_000_000);
  assert.equal(validateDebt({ ...base(), direction: "payable" }).direction, "payable");
});

test("Trả một phần, tất toán và xóa lần trả cập nhật đúng số dư", () => {
  const initial = validateDebt(base());
  const partial = withDebtPayment(initial, payment("p1", 500_000));
  assert.equal(paidDebtAmount(partial), 500_000);
  assert.equal(outstandingDebtAmount(partial), 1_500_000);
  assert.equal(debtStatus(partial, "2026-09-15"), "active");
  const settled = withDebtPayment(partial, payment("p2", 1_500_000, "2026-10-01"));
  assert.equal(debtStatus(settled, "2026-12-05"), "paid");
  assert.equal(outstandingDebtAmount(settled), 0);
  assert.equal(outstandingDebtAmount(withoutDebtPayment(settled, "p2")), 1_500_000);
  assert.equal(initial.payments.length, 0);
});

test("Ngăn trả quá dư, âm, trùng mã, trước ngày vay và thanh toán tương lai", () => {
  const withOne = withDebtPayment(base(), payment("p1", 1_000_000));
  assert.throws(() => withDebtPayment(withOne, payment("p2", 1_000_001)), /lớn hơn/);
  assert.throws(() => withDebtPayment(withOne, payment("p1", 50_000)), /tồn tại/);
  assert.throws(() => withDebtPayment(withOne, payment("p2", -2)), /không hợp lệ/);
  assert.throws(() => withDebtPayment(withOne, payment("p2", 2_000, "2026-07-01")), /không hợp lệ/);
  assert.throws(() => withDebtPayment(withOne, payment("p2", 2_000, "2090-01-01")), /không hợp lệ/);
  assert.throws(() => validateDebt({ ...base(), amount: 1_000, payments: [payment("p1", 2_000)] }), /vượt/);
  assert.throws(() => validateDebt({ ...base(), dueDate: "2026-07-30" }), /trước/);
  assert.throws(() => validateDebt({ ...base(), payments: "not-an-array" }), /danh sách/);
});

test("Nhận biết nợ quá hạn, sắp đến hạn và lọc tên không dấu", () => {
  const overdue = { ...base(), id: "a", dueDate: "2026-09-01" };
  const due = { ...base(), id: "b", direction: "payable", person: "Hùng", dueDate: "2026-09-20" };
  const paid = { ...base(), id: "c", person: "Trí", payments: [payment("pay", 2_000_000)] };
  assert.equal(debtStatus(overdue, "2026-09-10"), "overdue");
  assert.equal(debtStatus(due, "2026-09-15"), "dueSoon");
  const overview = debtOverview([overdue, due, paid], "2026-09-15");
  assert.equal(overview.receivable, 2_000_000);
  assert.equal(overview.payable, 2_000_000);
  assert.equal(overview.paidCount, 1);
  assert.equal(overview.overdueCount, 1);
  assert.equal(filterDebts([overdue, due, paid], { direction: "payable", today: "2026-09-15" }).length, 1);
  assert.equal(filterDebts([overdue, due, paid], { query: "hung", today: "2026-09-15" })[0].id, "b");
  assert.equal(filterDebts([paid, due, overdue], { today: "2026-09-15" }).map((row) => row.id).join(","), "a,b");
});

test("Excel năm không coi nợ gốc thành thu chi, tính số nợ còn lại đến 31/12", () => {
  const debt = { ...base(), id: "debt-1", payments: [payment("1", 500_000, "2026-09-10"), payment("2", 1_000_000, "2027-02-01")] };
  const snapshot = { collections: { ...emptyBackup().collections, debts: [debt] } };
  const sheets = buildAnnualSheets(snapshot, 2026);
  const rows = sheets.find((sheet) => sheet.name === "Sổ nợ")?.rows;
  assert.ok(rows);
  assert.equal(rows[1][5].value, 2_000_000);
  assert.equal(rows[1][6].value, 500_000);
  assert.equal(rows[1][7].value, 1_500_000);
  assert.equal(debtBalanceAt(debt, "2027-12-31"), 500_000);
  assert.equal(sheets.find((sheet) => sheet.name === "Trả nợ").rows.length, 2);
  const incomeExpense = sheets.find((sheet) => sheet.name === "Tổng hợp 12 tháng").rows;
  assert.equal(incomeExpense.at(-1)[1].value, 0);
  assert.equal(incomeExpense.at(-1)[2].value, 0);
});

test("JSON sao lưu V2 trước khi có Sổ nợ vẫn khôi phục được, bản mới lưu Sổ nợ", () => {
  const legacy = validateBackup(emptyBackup());
  assert.deepEqual(legacy.collections.debts, []);
  const current = emptyBackup();
  current.collections.debts = [{ id: "d1", ...base() }];
  const checked = validateBackup(current);
  assert.equal(checked.collections.debts.length, 1);
  assert.match(source("firebase/backup.js"), /"debts"/);
  assert.match(source("firebase/restoreBackup.js"), /RESTORE_COLLECTIONS/);
});

test("Sidebar, realtime Firestore, popup dùng chung và xác nhận xóa nợ đã kết nối", () => {
  assert.match(source("components/finance/FinanceLayout.jsx"), /"debts", "Sổ nợ"/);
  assert.match(source("App.jsx"), /<DebtsPage/);
  assert.match(source("hooks/useDebts.js"), /runTransaction/);
  assert.match(source("hooks/useDebts.js"), /useCloudCollection\(uid, "debts"\)/);
  assert.match(source("pages/DebtsPage.jsx"), /useIncrementalList/);
  assert.match(source("components/debts/DebtFormDialog.jsx"), /useModalDialog/);
  assert.match(source("components/debts/DebtDetailsDialog.jsx"), /useConfirm/);
});
