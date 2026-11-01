import { MIN_YEAR, MAX_YEAR } from "../../utils/dateLimits";

/** Reusable year navigator. Buttons avoid native number spinners in Mac / Edge. */
export const yearPage = (year) => MIN_YEAR + 12 * Math.floor((Number(year) - MIN_YEAR) / 12);

export default function YearGrid({ selected, pageStart, onPageChange, onSelect }) {
  return <div className="grid gap-3" aria-label="Chọn năm">
    <div className="flex items-center justify-between gap-2">
      <button type="button" aria-label="12 năm trước" disabled={pageStart <= MIN_YEAR} onClick={() => onPageChange(Math.max(MIN_YEAR, pageStart - 12))}
        className="grid size-10 place-items-center rounded-xl border border-slate-200 font-bold transition hover:bg-emerald-50 disabled:opacity-30 dark:border-slate-700 dark:hover:bg-slate-700">‹</button>
      <span className="text-sm font-bold tabular-nums">{pageStart} – {Math.min(MAX_YEAR, pageStart + 11)}</span>
      <button type="button" aria-label="12 năm sau" disabled={pageStart + 12 > MAX_YEAR} onClick={() => onPageChange(Math.min(yearPage(MAX_YEAR), pageStart + 12))}
        className="grid size-10 place-items-center rounded-xl border border-slate-200 font-bold transition hover:bg-emerald-50 disabled:opacity-30 dark:border-slate-700 dark:hover:bg-slate-700">›</button>
    </div>
    <div className="grid grid-cols-4 gap-1.5">
      {Array.from({length:12}, (_,i)=>pageStart+i).map((year) => <button type="button" key={year} disabled={year>MAX_YEAR} aria-pressed={year===Number(selected)}
        onClick={() => onSelect(year)} className={`min-h-11 rounded-xl text-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:opacity-25 ${year===Number(selected) ? "bg-emerald-600 text-white" : "bg-slate-50 hover:bg-emerald-50 dark:bg-slate-700/60 dark:hover:bg-slate-700"}`}>
        {year}
      </button>)}
    </div>
  </div>;
}
