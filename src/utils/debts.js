import { localDate, normalize, validDate } from "./finance.js";

export const DEBT_DIRECTIONS = Object.freeze([
  { value: "payable", label: "Tôi đang nợ" },
  { value: "receivable", label: "Người khác nợ tôi" },
]);

const MAX_AMOUNT = 999_999_999_999_000;
const amountValid = (amount, allowZero = false) => Number.isSafeInteger(amount) && amount >= (allowZero ? 0 : 1) && amount <= MAX_AMOUNT;
const validText = (text, max) => typeof text === "string" && text.trim().length > 0 && text.trim().length <= max;
const cleanText = (text) => String(text || "").trim();

export function debtPayments(debt) {
  return Array.isArray(debt?.payments) ? debt.payments : [];
}

export function paidDebtAmount(debt) {
  return debtPayments(debt).reduce((total, payment) => total + payment.amount, 0);
}

export function outstandingDebtAmount(debt) {
  return Math.max(0, debt.amount - paidDebtAmount(debt));
}

export function debtStatus(debt, today = localDate()) {
  if (outstandingDebtAmount(debt) === 0) return "paid";
  if (!debt.dueDate) return "undated";
  if (debt.dueDate < today) return "overdue";
  const limit = new Date(`${today}T12:00:00`);
  limit.setDate(limit.getDate() + 7);
  if (debt.dueDate <= localDate(limit)) return "dueSoon";
  return "active";
}

export function debtOverview(debts, today = localDate()) {
  return debts.reduce((summary, debt) => {
    const remaining = outstandingDebtAmount(debt);
    if (remaining === 0) { summary.paidCount++; return summary; }
    if (debt.direction === "payable") summary.payable += remaining;
    else summary.receivable += remaining;
    const status = debtStatus(debt, today);
    if (status === "overdue") { summary.overdueCount++; summary.overdueAmount += remaining; }
    if (status === "dueSoon") summary.dueSoonCount++;
    summary.activeCount++;
    return summary;
  }, { payable: 0, receivable: 0, overdueCount: 0, overdueAmount: 0, dueSoonCount: 0, activeCount: 0, paidCount: 0 });
}

export function validateDebt(data) {
  if (!data || !["payable", "receivable"].includes(data.direction)) throw new Error("Vui lòng chọn loại khoản nợ.");
  if (!validText(data.person, 120)) throw new Error("Tên người liên quan phải có từ 1 đến 120 ký tự.");
  if (!amountValid(data.amount)) throw new Error("Số tiền nợ không hợp lệ.");
  if (!validDate(data.date) || data.date > localDate()) throw new Error("Ngày ghi nợ phải là ngày đã diễn ra.");
  if (data.dueDate && (!validDate(data.dueDate) || data.dueDate < data.date))
    throw new Error("Ngày hẹn trả không được trước ngày ghi nợ.");
  if (typeof data.note !== "string" || data.note.length > 1200) throw new Error("Ghi chú quá dài.");
  if (data.payments !== undefined && !Array.isArray(data.payments)) throw new Error("Lịch sử thanh toán phải là một danh sách.");
  const payments = debtPayments(data);
  if (payments.length > 500) throw new Error("Một khoản nợ chỉ có thể lưu tối đa 500 lần thanh toán.");
  const ids = new Set();
  let paid = 0;
  for (const item of payments) {
    if (!item || typeof item.id !== "string" || !item.id || ids.has(item.id) ||
      !amountValid(item.amount) || !validDate(item.date) || item.date < data.date || item.date > localDate() ||
      typeof item.note !== "string" || item.note.length > 500) {
      throw new Error("Lịch sử thanh toán có dữ liệu không hợp lệ.");
    }
    ids.add(item.id);
    paid += item.amount;
    if (!Number.isSafeInteger(paid) || paid > data.amount) throw new Error("Tổng tiền đã trả vượt số nợ ban đầu.");
  }
  return {
    direction: data.direction,
    person: cleanText(data.person),
    amount: data.amount,
    date: data.date,
    dueDate: data.dueDate || "",
    note: data.note.trim(),
    payments: payments.map((item) => ({ id: item.id, amount: item.amount, date: item.date, note: item.note.trim(), createdAt: item.createdAt || 0 })),
  };
}

export function withDebtPayment(debt, payment) {
  const clean = validateDebt(debt);
  if (!payment || !validText(payment.id, 150) || !amountValid(payment.amount) || !validDate(payment.date) ||
    (payment.date < clean.date || payment.date > localDate()) || typeof payment.note !== "string" || payment.note.length > 500) {
    throw new Error("Lần thanh toán không hợp lệ.");
  }
  if (clean.payments.some((item) => item.id === payment.id)) throw new Error("Lần thanh toán đã tồn tại.");
  if (payment.amount > outstandingDebtAmount(clean)) throw new Error("Số tiền lớn hơn khoản còn phải trả.");
  if (clean.payments.length >= 500) throw new Error("Lịch sử thanh toán đã đạt giới hạn.");
  return validateDebt({ ...clean, payments: [...clean.payments, { id: payment.id, amount: payment.amount, date: payment.date, note: cleanText(payment.note), createdAt: payment.createdAt || 0 }] });
}

export function withoutDebtPayment(debt, paymentId) {
  const clean = validateDebt(debt);
  if (!clean.payments.some((p) => p.id === paymentId)) throw new Error("Lần thanh toán không còn tồn tại.");
  return validateDebt({ ...clean, payments: clean.payments.filter((p) => p.id !== paymentId) });
}

export function filterDebts(debts, { direction = "all", status = "active", query = "", today = localDate() } = {}) {
  const q = normalize(query.trim());
  const rank = { overdue: 0, dueSoon: 1, active: 2, undated: 3, paid: 4 };
  return debts.filter((debt) => {
    if (direction !== "all" && debt.direction !== direction) return false;
    const state = debtStatus(debt, today);
    if (status === "active" && state === "paid") return false;
    if (status === "paid" && state !== "paid") return false;
    if (status === "overdue" && state !== "overdue") return false;
    return !q || normalize(`${debt.person} ${debt.note}`).includes(q);
  }).sort((a, b) => {
    const s = rank[debtStatus(a, today)] - rank[debtStatus(b, today)];
    if (s) return s;
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate !== b.dueDate) return a.dueDate ? -1 : 1;
    return b.date.localeCompare(a.date);
  });
}

/** Debt settlement is a transfer of principal, NOT taxable income or spending. */
export function debtBalanceAt(debt, endDate) {
  if (debt.date > endDate) return 0;
  const paid = debtPayments(debt).filter((row) => row.date <= endDate).reduce((sum, row) => sum + row.amount, 0);
  return Math.max(0, debt.amount - paid);
}
