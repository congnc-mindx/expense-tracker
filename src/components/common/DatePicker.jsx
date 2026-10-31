import { useRef, useState } from "react";
import FloatingPanel from "./FloatingPanel";
import { localDate, validDate } from "../../utils/finance";
import { MIN_DATE, MAX_DATE, MIN_YEAR, MAX_YEAR, clampYear } from "../../utils/dateLimits";
import { button } from "../finance/ui";

const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const pad = (n) => String(n).padStart(2, "0");
export default function DatePicker({ value, onChange, label = "Chọn ngày", disabled = false }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => (validDate(value) ? value.slice(0, 7) : localDate().slice(0, 7)));
  const [y, m] = view.split("-").map(Number);
  const firstWeekday = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const days = new Date(y, m, 0).getDate();
  function shift(n) {
    const next = new Date(y, m - 1 + n, 1);
    if (next.getFullYear() >= MIN_YEAR && next.getFullYear() <= MAX_YEAR) setView(`${next.getFullYear()}-${pad(next.getMonth() + 1)}`);
  }
  function choose(date) { if (validDate(date)) { onChange(date); setOpen(false); ref.current?.focus(); } }
  const today = localDate();
  return <>
    <button type="button" ref={ref} disabled={disabled} aria-label={label} aria-haspopup="dialog" aria-expanded={open}
      onClick={() => { setView((validDate(value) ? value : today).slice(0, 7)); setOpen((s) => !s); }}
      className={`${button} w-full !justify-between !bg-white dark:!bg-slate-950`}>
      <span className="tabular-nums">{validDate(value) ? value.split("-").reverse().join("/") : "Chọn ngày"}</span>
      <span aria-hidden="true" className="text-blue-500">▦</span>
    </button>
    <FloatingPanel anchorRef={ref} open={open} onClose={() => setOpen(false)} maxHeight={405} minWidth={316}>
      <div role="dialog" aria-label={label} className="p-2">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button type="button" className={`${button} !min-h-9 !px-2`} disabled={y === MIN_YEAR && m === 1} onClick={() => shift(-1)}>‹</button>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">Tháng {m}</span>
            <input type="number" min={MIN_YEAR} max={MAX_YEAR} aria-label="Năm" value={y}
              onChange={(e) => { const year = Number(e.target.value); if (year >= MIN_YEAR && year <= MAX_YEAR) setView(`${year}-${pad(m)}`); }}
              className="w-19 rounded-lg border border-slate-300 bg-white p-1.5 text-center font-semibold tabular-nums dark:border-slate-600 dark:bg-slate-950"/>
          </div>
          <button type="button" className={`${button} !min-h-9 !px-2`} disabled={y === MAX_YEAR && m === 12} onClick={() => shift(1)}>›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">{dayNames.map((day) => <span key={day} className="py-1">{day}</span>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekday }, (_, i) => <span key={`pad-${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const date = `${view}-${pad(i + 1)}`;
            const selected = value === date;
            return <button key={date} type="button" onClick={() => choose(date)} aria-pressed={selected}
              className={`aspect-square rounded-lg text-sm tabular-nums transition-colors ${selected ? "bg-blue-600 font-bold text-white" : date === today ? "bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}>{i + 1}</button>;
          })}
        </div>
        <button type="button" className="mt-3 w-full rounded-lg py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700" onClick={() => choose(today >= MIN_DATE && today <= MAX_DATE ? today : `${clampYear(Number(today.slice(0, 4)))}-01-01`)}>Hôm nay</button>
      </div>
    </FloatingPanel>
  </>;
}
