import { MIN_YEAR, MAX_YEAR } from "../../utils/dateLimits";
import { button } from "../finance/ui";

/** Compact year navigation aligned with MonthPicker. */
export default function YearPicker({ value, onChange, className = "" }) {
  const year = Number(value);
  return (
    <div className={`flex min-w-0 items-center gap-1.5 ${className}`}>
      <button
        type="button"
        className={`${button} !px-3`}
        disabled={year <= MIN_YEAR}
        onClick={() => onChange(year - 1)}
        aria-label="Năm trước"
      >
        ‹
      </button>
      <label
        className={`${button} min-w-0 flex-1 !justify-center gap-2 whitespace-nowrap`}
      >
        <span className="shrink-0">Năm</span>
        <input
          type="number"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={year}
          aria-label="Năm tổng kết"
          onChange={(event) => {
            const next = Number(event.target.value);
            if (next >= MIN_YEAR && next <= MAX_YEAR) onChange(next);
          }}
          className="w-17 min-w-0 bg-transparent text-center font-semibold tabular-nums outline-none"
        />
      </label>
      <button
        type="button"
        className={`${button} !px-3`}
        disabled={year >= MAX_YEAR}
        onClick={() => onChange(year + 1)}
        aria-label="Năm sau"
      >
        ›
      </button>
    </div>
  );
}
