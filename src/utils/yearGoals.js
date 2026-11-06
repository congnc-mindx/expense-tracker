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

/** Only compare goals in months that have begun; future targets are not "missed". */
export function goalProgressForYear(rows = []) {
  const defined = rows.filter((row) => (row.target ?? 0) > 0 || (row.savingsTarget ?? 0) > 0).length;
  const incomeRows = rows.filter((row) => !row.future && (row.target ?? 0) > 0);
  const savingRows = rows.filter((row) => !row.future && (row.savingsTarget ?? 0) > 0);
  const sum = (selected, field) => selected.reduce((total, row) => total + (row[field] || 0), 0);
  const percentage = (actual, expected) => expected > 0 ? `${Math.round(actual / expected * 100)}%` : "Chưa đặt";
  return {
    defined,
    eligible: incomeRows.length,
    reached: incomeRows.filter((row) => row.income >= row.target).length,
    incomeProgress: percentage(sum(incomeRows, "income"), sum(incomeRows, "target")),
    savingsProgress: percentage(sum(savingRows, "savings"), sum(savingRows, "savingsTarget")),
  };
}
