/** Year goals are projections; historical savings are recorded separately. */
export function applyYearGoals(months, scope, month, goals, recordedSavings = null) {
  if (!Array.isArray(months) || months.length !== 12) throw new Error("Bảng năm không hợp lệ.");
  if (scope !== "all" && scope !== "month") throw new Error("Phạm vi áp dụng không hợp lệ.");
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error("Tháng không hợp lệ.");
  const valid = (value) => value === null || (Number.isSafeInteger(value) && value >= 0);
  if (!valid(goals?.target) || !valid(goals?.savingsTarget)) throw new Error("Mục tiêu tiền không hợp lệ.");
  if (scope === "month" && recordedSavings !== null && (!Number.isSafeInteger(recordedSavings) || recordedSavings < 0)) {
    throw new Error("Số tiền đã tiết kiệm không hợp lệ.");
  }
  return months.map((item, index) => {
    if (scope === "month" && index !== month - 1) return { ...item };
    return { ...item, target: goals.target, savingsTarget: goals.savingsTarget,
      ...(scope === "month" && recordedSavings !== null ? { savings: recordedSavings } : {}) };
  });
}
