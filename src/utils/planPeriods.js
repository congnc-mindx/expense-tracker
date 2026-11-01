/** Keep plan time views as read-only selectors: no Firestore schema migration.
 * A plan belongs to the month/year of its target date. Undated plans stay in "All".
 */
export function filterPlansByPeriod(plans, { scope = "all", month, year } = {}) {
  if (scope === "all") return plans;
  if (scope === "month") return plans.filter((plan) =>
    typeof plan.targetDate === "string" && plan.targetDate.startsWith(`${month}-`));
  if (scope === "year") return plans.filter((plan) =>
    typeof plan.targetDate === "string" && plan.targetDate.startsWith(`${year}-`));
  return plans;
}
