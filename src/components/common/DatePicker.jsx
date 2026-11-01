import { useRef, useState } from "react";
import FloatingPanel from "./FloatingPanel";
import YearGrid, { yearPage } from "./YearGrid";
import { localDate, validDate } from "../../utils/finance";
import { MIN_DATE, MAX_DATE, MIN_YEAR, MAX_YEAR } from "../../utils/dateLimits";
import { button } from "../finance/ui";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTHS = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];
const pad = (n) => String(n).padStart(2, "0");
const SMALL_BUTTON = "grid size-8 shrink-0 place-items-center rounded-lg text-lg font-semibold text-slate-600 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700";

function CalendarIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" className="size-5 text-emerald-600 dark:text-emerald-400">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M7.5 3v4M16.5 3v4M3 10h18" />
    <path d="M8 14h2m4 0h2m-8 4h2" />
  </svg>;
}

export default function DatePicker({ value, onChange, label = "Chọn ngày", disabled = false }) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => (validDate(value) ? value : localDate()).slice(0, 7));
  const [screen, setScreen] = useState("days");
  const [yearStart, setYearStart] = useState(() => yearPage(Number((validDate(value) ? value : localDate()).slice(0, 4))));
  const [year, month] = view.split("-").map(Number);
  const today = localDate();
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  function moveMonth(step) {
    const next = new Date(year, month - 1 + step, 1);
    if (next.getFullYear() >= MIN_YEAR && next.getFullYear() <= MAX_YEAR)
      setView(`${next.getFullYear()}-${pad(next.getMonth() + 1)}`);
  }
  function choose(date) {
    if (!validDate(date)) return;
    onChange(date);
    setOpen(false);
    anchorRef.current?.focus();
  }
  function show() {
    const initial = validDate(value) ? value : today;
    setView(initial.slice(0, 7));
    setYearStart(yearPage(Number(initial.slice(0, 4))));
    setScreen("days");
    setOpen((was) => !was);
  }

  return <>
    <button type="button" ref={anchorRef} disabled={disabled} aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={show}
      className={`${button} w-full !justify-between !bg-white !py-2 dark:!bg-slate-950`}>
      <span className="tabular-nums">{validDate(value) ? value.split("-").reverse().join("/") : "Chọn ngày"}</span>
      <CalendarIcon />
    </button>
    <FloatingPanel anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} minWidth={296} maxHeight={360} className="!rounded-2xl !p-2">
      <div role="dialog" aria-label={label} className="w-full min-w-0">
        {screen === "days" && <>
          <div className="flex items-center justify-between gap-1 pb-2">
            <button type="button" className={SMALL_BUTTON} aria-label="Tháng trước" disabled={year === MIN_YEAR && month === 1} onClick={() => moveMonth(-1)}>‹</button>
            <div className="flex items-center gap-1">
              <button type="button" className="rounded-lg px-2 py-1.5 text-sm font-extrabold hover:bg-emerald-50 dark:hover:bg-slate-700" onClick={() => setScreen("months")}>Tháng {month} <span className="text-[10px] text-slate-400">⌄</span></button>
              <button type="button" className="rounded-lg px-2 py-1.5 text-sm font-extrabold tabular-nums hover:bg-emerald-50 dark:hover:bg-slate-700" onClick={() => {setYearStart(yearPage(year));setScreen("years");}}>{year} <span className="text-[10px] text-slate-400">⌄</span></button>
            </div>
            <button type="button" className={SMALL_BUTTON} aria-label="Tháng sau" disabled={year === MAX_YEAR && month === 12} onClick={() => moveMonth(1)}>›</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 border-b border-slate-100 pb-1 text-center text-[11px] font-bold text-slate-400 dark:border-slate-700">
            {WEEKDAYS.map((day) => <span key={day} className="py-1">{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {Array.from({ length: cellCount }, (_, i) => {
              const day = i - firstWeekday + 1;
              if (day < 1 || day > daysInMonth) return <span key={`pad-${i}`} className="h-9" />;
              const date = `${view}-${pad(day)}`;
              const selected = date === value;
              const isToday = date === today;
              return <button key={date} type="button" aria-label={`Ngày ${day} tháng ${month} năm ${year}`} aria-pressed={selected}
                onClick={() => choose(date)}
                className={`h-9 rounded-lg text-sm tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600 ${selected ? "bg-emerald-600 font-extrabold text-white" : isToday ? "bg-emerald-50 font-extrabold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                {day}
              </button>;
            })}
          </div>
          <div className="mt-1 flex justify-between border-t border-slate-100 pt-2 dark:border-slate-700">
            <button type="button" className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => setOpen(false)}>Đóng</button>
            <button type="button" className="rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-700" onClick={() => choose(today >= MIN_DATE && today <= MAX_DATE ? today : MIN_DATE)}>Hôm nay</button>
          </div>
        </>}
        {screen === "months" && <>
          <div className="mb-3 flex items-center justify-between gap-2 px-2"><strong className="text-sm">Chọn tháng {year}</strong><button type="button" className={SMALL_BUTTON} aria-label="Quay lại lịch" onClick={() => setScreen("days")}>×</button></div>
          <div className="grid grid-cols-4 gap-2">
            {MONTHS.map((label, index) => <button type="button" key={label} onClick={() => {setView(`${year}-${pad(index+1)}`);setScreen("days");}}
              className={`min-h-11 rounded-xl text-sm font-bold transition-colors ${month === index+1 ? "bg-emerald-600 text-white" : "bg-slate-50 hover:bg-emerald-50 dark:bg-slate-700 dark:hover:bg-slate-600"}`}>{label}</button>)}
          </div>
        </>}
        {screen === "years" && <div className="grid gap-3">
          <YearGrid selected={year} pageStart={yearStart} onPageChange={setYearStart} onSelect={(y)=>{setView(`${y}-${pad(month)}`);setScreen("days");}} />
          <button type="button" className="rounded-lg py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => setScreen("days")}>Quay lại chọn ngày</button>
        </div>}
      </div>
    </FloatingPanel>
  </>;
}
