import { useRef, useState } from "react";
import FloatingPanel from "./FloatingPanel";
import YearGrid, { yearPage } from "./YearGrid";
import { MIN_YEAR, MAX_YEAR } from "../../utils/dateLimits";
import { localDate, shiftMonth } from "../../utils/finance";
import { button } from "../finance/ui";

const MONTHS = Array.from({ length: 12 }, (_, index) => `Tháng ${index + 1}`);
const FIRST_MONTH = `${MIN_YEAR}-01`;
const LAST_MONTH = `${MAX_YEAR}-12`;
const TAB = "min-h-10 rounded-xl px-4 text-sm font-bold transition-colors";

/** Shared month/year popover: two explicit selectors, one panel per mode, no numeric spinners. */
export default function MonthPicker({ value, onChange, className = "" }) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const [pageStart, setPageStart] = useState(yearPage(Number(value.slice(0, 4))));
  const [mode, setMode] = useState("months");
  const month = Number(value.slice(5));
  const today = localDate().slice(0, 7);
  function select(nextMonth) {
    onChange(`${year}-${String(nextMonth).padStart(2, "0")}`);
    setOpen(false);
    anchorRef.current?.focus();
  }
  function openPicker() {
    setYear(Number(value.slice(0, 4)));
    setPageStart(yearPage(Number(value.slice(0, 4))));
    setMode("months");
    setOpen((was) => !was);
  }
  return <div className={`flex min-w-0 flex-wrap items-center gap-1.5 sm:flex-nowrap ${className}`}>
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      <button type="button" aria-label="Tháng trước" disabled={value <= FIRST_MONTH} className={`${button} !min-h-11 shrink-0 !px-3`} onClick={() => onChange(shiftMonth(value, -1))}>‹</button>
      <button type="button" ref={anchorRef} aria-label="Chọn tháng và năm" aria-haspopup="dialog" aria-expanded={open} onClick={openPicker}
        className={`${button} min-w-0 flex-1 !justify-center gap-2 !px-2 text-center !font-bold tabular-nums sm:!px-4`}>
        <span className="truncate">Tháng {month}/{value.slice(0, 4)}</span><span className="text-[10px] text-slate-400">⌄</span>
      </button>
      <button type="button" aria-label="Tháng sau" disabled={value >= LAST_MONTH} className={`${button} !min-h-11 shrink-0 !px-3`} onClick={() => onChange(shiftMonth(value, 1))}>›</button>
    </div>
    <button type="button" className={`${button} !min-h-11 flex-1 whitespace-nowrap !px-3 sm:flex-none`} disabled={today < FIRST_MONTH || today > LAST_MONTH}
      onClick={() => { onChange(today); setOpen(false); }}>Tháng này</button>
    <FloatingPanel anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} minWidth={344} maxHeight={420} className="!rounded-2xl !p-3">
      <div role="dialog" aria-label="Chọn tháng và năm" className="grid gap-3">
        <div role="tablist" aria-label="Chọn loại thời gian" className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          <button type="button" role="tab" aria-selected={mode === "months"} className={`${TAB} ${mode === "months" ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300" : "text-slate-600 dark:text-slate-300"}`} onClick={() => setMode("months")}>Tháng {month}</button>
          <button type="button" role="tab" aria-selected={mode === "years"} className={`${TAB} ${mode === "years" ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300" : "text-slate-600 dark:text-slate-300"}`} onClick={() => { setPageStart(yearPage(year)); setMode("years"); }}>Năm {year}</button>
        </div>
        {mode === "years" ? (
          <YearGrid selected={year} pageStart={pageStart} onPageChange={setPageStart} onSelect={(nextYear) => { setYear(nextYear); setMode("months"); }} />
        ) : <>
          <div className="flex items-center justify-between gap-2 px-1">
            <button type="button" aria-label="Năm trước" className="rounded-lg px-3 py-2 text-lg hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-700" disabled={year <= MIN_YEAR} onClick={() => setYear((y) => y - 1)}>‹</button>
            <span className="text-sm font-bold tabular-nums">Năm {year}</span>
            <button type="button" aria-label="Năm sau" className="rounded-lg px-3 py-2 text-lg hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-700" disabled={year >= MAX_YEAR} onClick={() => setYear((y) => y + 1)}>›</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((label, index) => <button type="button" key={label} aria-pressed={year === Number(value.slice(0, 4)) && month === index + 1} onClick={() => select(index + 1)}
              className={`min-h-11 rounded-xl text-sm font-semibold transition-colors ${year === Number(value.slice(0, 4)) && month === index + 1 ? "bg-emerald-600 text-white" : "bg-slate-50 hover:bg-emerald-50 dark:bg-slate-700/60 dark:hover:bg-slate-700"}`}>{label}</button>)}
          </div>
        </>}
      </div>
    </FloatingPanel>
  </div>;
}
