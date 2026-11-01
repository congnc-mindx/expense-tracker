import { validDate, localDate, normalize } from "./finance.js";

export const PLAN_CATEGORIES = [
  { value: "home", label: "Nhà cửa", icon: "⌂" },
  { value: "wedding", label: "Cưới hỏi", icon: "♡" },
  { value: "shopping", label: "Mua sắm", icon: "◈" },
  { value: "travel", label: "Du lịch", icon: "✈" },
  { value: "learning", label: "Học tập", icon: "✎" },
  { value: "other", label: "Khác", icon: "◎" },
];

export const PLAN_TYPES = ["active", "completed"];

export function planCategory(category) {
  return PLAN_CATEGORIES.find((item) => item.value === category) || PLAN_CATEGORIES.at(-1);
}

const amount = (value) => Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
/** Existing savedAmount remains the unallocated fund. Task funding is additive, never inferred from checking an item. */
export function planFunding(plan) {
  const tasks = Array.isArray(plan?.tasks) ? plan.tasks : [];
  const allocated = tasks.reduce((sum, task) => sum + amount(task.preparedAmount), 0);
  const estimated = tasks.reduce((sum, task) => sum + amount(task.estimatedAmount), 0);
  const unallocated = amount(plan?.savedAmount);
  return { allocated, unallocated, prepared: allocated + unallocated, estimated };
}

export function validatePlan(input) {
  const title = String(input?.title || "").trim();
  const note = String(input?.note || "").trim();
  const targetAmount = Number(input?.targetAmount);
  const savedAmount = Number(input?.savedAmount ?? 0);
  const targetDate = String(input?.targetDate || "");
  const tasks = input?.tasks ?? [];
  if (!title || title.length > 120) throw new Error("Tên kế hoạch phải có từ 1 đến 120 ký tự.");
  if (!PLAN_CATEGORIES.some((item) => item.value === input?.category)) throw new Error("Vui lòng chọn nhóm kế hoạch hợp lệ.");
  if (!Number.isSafeInteger(targetAmount) || targetAmount <= 0) throw new Error("Số tiền mục tiêu phải lớn hơn 0.");
  if (!Number.isSafeInteger(savedAmount) || savedAmount < 0) throw new Error("Quỹ chung đã chuẩn bị không hợp lệ.");
  if (targetDate && !validDate(targetDate)) throw new Error("Ngày dự kiến không hợp lệ (2023–2091).");
  if (note.length > 1000) throw new Error("Ghi chú tối đa 1.000 ký tự.");
  if (!Array.isArray(tasks) || tasks.length > 40) throw new Error("Một kế hoạch chỉ có tối đa 40 đầu việc.");
  const cleanTasks = tasks.map((task) => ({
    id: String(task.id || ""),
    title: String(task.title || "").trim(),
    done: Boolean(task.done),
    estimatedAmount: Number(task.estimatedAmount ?? 0),
    preparedAmount: Number(task.preparedAmount ?? 0),
  }));
  if (cleanTasks.some((task) => !task.id || !task.title || task.title.length > 150) || new Set(cleanTasks.map((task) => task.id)).size !== cleanTasks.length)
    throw new Error("Checklist có đầu việc không hợp lệ hoặc bị trùng mã.");
  if (cleanTasks.some((task) => !Number.isSafeInteger(task.estimatedAmount) || task.estimatedAmount < 0 || !Number.isSafeInteger(task.preparedAmount) || task.preparedAmount < 0))
    throw new Error("Chi phí đầu việc phải là số tiền không âm hợp lệ.");
  if (!Number.isSafeInteger(planFunding({ savedAmount, tasks: cleanTasks }).prepared))
    throw new Error("Tổng tiền đã chuẩn bị vượt giới hạn cho phép.");
  const status = input?.status === "completed" ? "completed" : "active";
  return { title, category: input.category, targetAmount, savedAmount, targetDate, note, tasks: cleanTasks, status };
}

export function planProgress(plan) {
  const target = Number(plan?.targetAmount) || 0;
  const { prepared } = planFunding(plan);
  const percentage = target > 0 ? Math.round((prepared / target) * 100) : 0;
  return { percentage, width: Math.min(100, percentage), remaining: Math.max(0, target - prepared), prepared };
}

export function planTasksProgress(plan) {
  const tasks = Array.isArray(plan?.tasks) ? plan.tasks : [];
  return { done: tasks.filter((task) => task.done).length, total: tasks.length };
}

export function planDeadline(plan, today = localDate()) {
  if (plan?.status === "completed") return "completed";
  if (!plan?.targetDate) return "none";
  if (plan.targetDate < today) return "overdue";
  if (plan.targetDate === today) return "today";
  return "upcoming";
}

export function filteredPlans(plans, { filter = "active", query = "" } = {}) {
  const term = normalize(query.trim());
  return plans.filter((plan) => {
    if (filter !== "all" && plan.status !== filter) return false;
    const category = planCategory(plan.category).label;
    return !term || normalize(`${plan.title} ${plan.note || ""} ${category} ${(plan.tasks || []).map((task)=>task.title).join(" ")}`).includes(term);
  }).sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    if (a.status === "active") {
      const aDate = a.targetDate || "9999-12-31";
      const bDate = b.targetDate || "9999-12-31";
      if (aDate !== bDate) return aDate.localeCompare(bDate);
    }
    return Number(b.updatedAt || 0) - Number(a.updatedAt || 0);
  });
}
