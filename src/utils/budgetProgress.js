/** 
 * Color budget usage by the raw (unrounded) ratio so thresholds are exact.
 * No limit is a neutral state. Values are already in VND.
 */
export function getBudgetProgress(spent, total) {
  if (!Number.isFinite(total) || total <= 0) {
    return {
      tone: "neutral", percentage: 0, exceeded: false,
      label: "Chưa đặt hạn mức", shortLabel: "Chưa đặt",
      textClass: "text-slate-500 dark:text-slate-400",
      barClass: "bg-slate-400 dark:bg-slate-500",
      badgeClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    };
  }

  const ratio = Math.max(0, (Number(spent) || 0) / total) * 100;
  const percentage = Math.round(ratio);
  const exceeded = ratio > 100;
  const tone = ratio <= 50 ? "green" : ratio <= 80 ? "yellow" : "red";
  const palette = {
    green: {
      textClass: "text-[#368453] dark:text-emerald-400",
      barClass: "bg-[#4caa71] dark:bg-emerald-500",
      badgeClass: "bg-[#eaf5ed] text-[#35714b] dark:bg-emerald-950/40 dark:text-emerald-300",
      label: "Trong hạn mức", shortLabel: "An toàn",
    },
    yellow: {
      textClass: "text-amber-600 dark:text-amber-400",
      barClass: "bg-amber-500 dark:bg-amber-400",
      badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      label: "Cần chú ý", shortLabel: "Cần chú ý",
    },
    red: {
      textClass: "text-rose-600 dark:text-rose-400",
      barClass: "bg-rose-500 dark:bg-rose-500",
      badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
      label: exceeded ? "Vượt hạn mức" : "Sắp hết ngân sách",
      shortLabel: exceeded ? "Vượt mức" : "Sắp hết",
    },
  };
  return { tone, percentage, exceeded, ...palette[tone] };
}
