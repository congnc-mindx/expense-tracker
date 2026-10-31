import { MIN_YEAR, MAX_YEAR } from "../../utils/dateLimits";
import { useRef, useState } from "react";
import FloatingPanel from "./FloatingPanel";
import { localDate, shiftMonth } from "../../utils/finance";
import { button } from "../finance/ui";

const MONTHS = [
  "Th1",
  "Th2",
  "Th3",
  "Th4",
  "Th5",
  "Th6",
  "Th7",
  "Th8",
  "Th9",
  "Th10",
  "Th11",
  "Th12",
];
export default function MonthPicker({ value, onChange, className = "" }) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const month = Number(value.slice(5));
  function select(n) {
    if (year < MIN_YEAR || year > MAX_YEAR) return;
    onChange(`${year}-${String(n).padStart(2, "0")}`);
    setOpen(false);
  }
  return (
    <div className={`flex min-w-0 items-center gap-1.5 ${className}`}>
      <button
        type="button"
        className={`${button} !px-3`}
        onClick={() => onChange(shiftMonth(value, -1))}
        aria-label="Tháng trước"
      >
        ‹
      </button>
      <button
        ref={anchorRef}
        type="button"
        aria-label="Chọn tháng"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`${button} min-w-0 flex-1 !justify-between whitespace-nowrap`}
        onClick={() => {
          setYear(Number(value.slice(0, 4)));
          setOpen((prev) => !prev);
        }}
      >
        <span className="truncate">
          Tháng {month}/{value.slice(0, 4)}
        </span>
        <span className="text-slate-400">▦</span>
      </button>
      <button
        type="button"
        className={`${button} !px-3`}
        onClick={() => onChange(shiftMonth(value, 1))}
        aria-label="Tháng sau"
      >
        ›
      </button>
      <FloatingPanel
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        maxHeight={360}
      >
        <div role="dialog" aria-label="Chọn tháng và năm" className="p-1.5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
              disabled={year <= MIN_YEAR}
              onClick={() => setYear((v) => Math.max(MIN_YEAR, v - 1))}
              aria-label="Năm trước"
            >
              ‹
            </button>
            <input
              type="number"
              aria-label="Năm"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={year}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (n >= MIN_YEAR && n <= MAX_YEAR) setYear(n);
              }}
              className="w-20 rounded-lg border border-slate-300 bg-white p-1 text-center font-semibold tabular-nums dark:border-slate-600 dark:bg-slate-800"
            />
            <button
              type="button"
              className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
              disabled={year >= MAX_YEAR}
              onClick={() => setYear((v) => Math.min(MAX_YEAR, v + 1))}
              aria-label="Năm sau"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {MONTHS.map((label, index) => (
              <button
                type="button"
                key={label}
                onClick={() => select(index + 1)}
                aria-current={
                  year === Number(value.slice(0, 4)) && index + 1 === month
                    ? "date"
                    : undefined
                }
                className={`rounded-lg p-2.5 text-sm font-semibold transition-colors ${year === Number(value.slice(0, 4)) && index + 1 === month ? "bg-emerald-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 w-full rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-700"
            onClick={() => {
              onChange(localDate().slice(0, 7));
              setOpen(false);
            }}
          >
            Về tháng hiện tại
          </button>
        </div>
      </FloatingPanel>
    </div>
  );
}
