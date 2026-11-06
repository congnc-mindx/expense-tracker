import { MIN_YEAR, MAX_YEAR } from "../../utils/dateLimits";

const PAGE_SIZE = 4;
const pageFloor = (year) => {
  const current = Number(year) || new Date().getFullYear();
  const start = Math.max(MIN_YEAR, current - 2);
  return Math.min(Math.max(MIN_YEAR, start), Math.max(MIN_YEAR, MAX_YEAR - (PAGE_SIZE - 1)));
};

/** Reusable year navigator. Compact 4-year window keeps current + next year visible first. */
export const yearPage = (year) => pageFloor(year);

export default function YearGrid({ selected, pageStart, onPageChange, onSelect }) {
  const safeStart = Math.min(Math.max(MIN_YEAR, pageStart || pageFloor(selected)), Math.max(MIN_YEAR, MAX_YEAR - (PAGE_SIZE - 1)));
  return <div className="grid gap-3" aria-label="Chọn năm">
    <div className="flex items-center justify-between gap-2">
      <button type="button" aria-label={`${PAGE_SIZE} năm trước`} disabled={safeStart <= MIN_YEAR} onClick={() => onPageChange(Math.max(MIN_YEAR, safeStart - PAGE_SIZE))}
        className="grid size-10 place-items-center rounded-xl border border-slate-200 font-bold transition hover:bg-emerald-50 disabled:opacity-30 dark:border-slate-700 dark:hover:bg-slate-700">‹</button>
      <span className="text-sm font-bold tabular-nums">{safeStart} – {Math.min(MAX_YEAR, safeStart + PAGE_SIZE - 1)}</span>
      <button type="button" aria-label={`${PAGE_SIZE} năm sau`} disabled={safeStart + PAGE_SIZE > MAX_YEAR} onClick={() => onPageChange(Math.min(Math.max(MIN_YEAR, MAX_YEAR - (PAGE_SIZE - 1)), safeStart + PAGE_SIZE))}
        className="grid size-10 place-items-center rounded-xl border border-slate-200 font-bold transition hover:bg-emerald-50 disabled:opacity-30 dark:border-slate-700 dark:hover:bg-slate-700">›</button>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {Array.from({length: PAGE_SIZE}, (_,i)=>safeStart+i).map((year) => <button type="button" key={year} disabled={year>MAX_YEAR} aria-pressed={year===Number(selected)}
        onClick={() => onSelect(year)} className={`min-h-12 rounded-xl text-base font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:opacity-25 ${year===Number(selected) ? "bg-emerald-600 text-white" : "bg-slate-50 hover:bg-emerald-50 dark:bg-slate-700/60 dark:hover:bg-slate-700"}`}>
        {year}
      </button>)}
    </div>
  </div>;
}
