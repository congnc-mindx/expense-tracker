/**
 * Plan time horizons are a user choice, not an automatic status transition.
 * Older plans have no `horizon`; infer once from their original creation date
 * and due date so their display remains compatible without a Firestore migration.
 */
export const PLAN_HORIZONS = Object.freeze([
  { value: "short", label: "Ngắn hạn", description: "Kế hoạch theo tháng, thường trong 12 tháng" },
  { value: "long", label: "Dài hạn", description: "Mục tiêu lớn hoặc kéo dài nhiều năm" },
]);

const isMonthKey = (key) => /^\d{4}-(?:0[1-9]|1[0-2])$/.test(key);

function monthDifference(start, end) {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  return (ey - sy) * 12 + em - sm;
}

/** Explicit horizons stay stable as time passes; legacy plans use a safe inference. */
export function planHorizon(plan, today = new Date()) {
  if (plan?.horizon === "short" || plan?.horizon === "long") return plan.horizon;
  const target = String(plan?.targetDate ?? "").slice(0, 7);
  if (!isMonthKey(target)) return "short";
  const createdMs = Number(plan?.createdAt);
  const created = Number.isFinite(createdMs) && createdMs > 0
    ? new Date(createdMs) : today;
  const origin = Number.isFinite(created.getTime())
    ? `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`
    : target;
  return monthDifference(origin, target) > 12 ? "long" : "short";
}

export function filterPlansByHorizon(plans, horizon = "all") {
  if (horizon === "all") return plans;
  return plans.filter((plan) => planHorizon(plan) === horizon);
}

/** Preserves plan ordering and separates the list into two meaningful sections. */
export function groupPlansByHorizon(plans) {
  return PLAN_HORIZONS.map((horizon) => ({
    ...horizon,
    plans: plans.filter((plan) => planHorizon(plan) === horizon.value),
  }));
}
