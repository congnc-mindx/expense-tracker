import { getBudgetProgress } from "../../utils/budgetProgress";

export default function BudgetProgressBar({ spent, limit, title = "Tiến độ ngân sách", large = false }) {
  const status = getBudgetProgress(spent, limit);
  return <div className="min-w-0" aria-label={title}>
    <div className={`mb-2 flex items-center justify-between gap-3 font-semibold ${large ? "text-sm" : "text-xs"}`}>
      <span className={limit > 0 ? status.textClass : "text-slate-500 dark:text-slate-400"}>
        {limit > 0 ? status.label : "Chưa đặt hạn mức"}
      </span>
      <span className={`tabular-nums ${status.textClass}`}>{limit > 0 ? `${status.percentage}%` : "—"}</span>
    </div>
    <div role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={limit > 0 ? Math.min(100, status.percentage) : 0}
      className={`${large ? "h-3" : "h-2"} overflow-hidden rounded-full bg-[#e5eee8] dark:bg-slate-800`}>
      <div className={`h-full rounded-full transition-[width] duration-300 ${status.barClass}`}
        style={{ width: `${limit > 0 ? Math.min(100, status.percentage) : 0}%` }} />
    </div>
  </div>;
}
