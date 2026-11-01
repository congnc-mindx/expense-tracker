import { MIN_YEAR, MAX_YEAR } from "./dateLimits.js";
import { validDate } from "./finance.js";

const validMonth = (value) => typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
  && Number(value.slice(0, 4)) >= MIN_YEAR && Number(value.slice(0, 4)) <= MAX_YEAR;

export function recurringTransactionId(ruleId, month) { return `recurring_${ruleId}_${month}`; }
export function recurringDate(month, day) {
  if (!validMonth(month)) return null;
  const [year, number] = month.split("-").map(Number);
  const last = new Date(year, number, 0).getDate();
  return `${month}-${String(Math.min(last, Number(day))).padStart(2, "0")}`;
}

/** Legacy rules without `type` are always expenses. Do not rewrite stored rows to migrate. */
export function recurringType(rule) { return rule?.type === "income" ? "income" : "expense"; }

export function validateRecurringRule(data, config) {
  if (data.type && !["income", "expense"].includes(data.type)) throw new Error("Loại khoản định kỳ không hợp lệ.");
  const type = recurringType(data);
  const category = String(data.category || "");
  const amount = Number(data.amount);
  const day = Number(data.day);
  const startMonth = String(data.startMonth || "");
  const endMonth = String(data.endMonth || "");
  const title = String(data.title || "").trim();
  if (!title || title.length > 100 || !Number.isSafeInteger(amount) || amount <= 0
    || !Number.isInteger(day) || day < 1 || day > 31 || !validMonth(startMonth)
    || (endMonth && (!validMonth(endMonth) || endMonth < startMonth))
    || !config[type].some((item) => item.id === category && !item.locked)) {
    throw new Error("Kiểm tra tên, số tiền, danh mục, ngày lặp và khoảng tháng.");
  }
  return { type, title, amount, category, day, startMonth, endMonth, active: data.active !== false,
    note: String(data.note || "").trim().slice(0, 500) };
}

/** Keep the previous API working for tests and any external modules. */
export const validateRecurringExpense = validateRecurringRule;

/** Historical revisions keep past months stable when a recurring rule is edited,
 * paused or removed. Old rules without history remain fully compatible.
 */
export function recurringSegments(rule) {
  return [...(Array.isArray(rule.history) ? rule.history : []), rule];
}
function ruleForPeriod(rule, month) {
  return recurringSegments(rule).find((segment) =>
    segment.active !== false && segment.startMonth <= month &&
    (!segment.endMonth || segment.endMonth >= month));
}
export function recurringForMonth(rules, month, transactions) {
  if (!validMonth(month)) return [];
  const ids = new Set(transactions.map((tx) => tx.id));
  return rules.flatMap((rule) => {
    const segment = ruleForPeriod(rule, month);
    if (!segment) return [];
    const date = recurringDate(month, segment.day);
    const id = recurringTransactionId(rule.id, month);
    if (!validDate(date) || ids.has(id)) return [];
    return [{ id, type: recurringType(segment), origin: "recurring", virtual: true, recurringId: rule.id,
      recurringMonth: month, category: segment.category, amount: segment.amount, date, status: "planned",
      note: segment.note || segment.title, title: segment.title }];
  });
}
export const monthlyExpenseCount = (rules) => rules.filter((rule) => rule.active && recurringType(rule) === "expense").length;
