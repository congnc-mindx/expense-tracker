import { panel, muted } from "./ui";
import { formatMoney } from "../../utils/money.js";
export default function FinanceCards({ items, columns = 4, compact = false }) {
  const colors = {
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    red: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    blue: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  };
  return (
    <div className={`grid min-w-0 gap-3 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : columns === 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
      {items.map(({ label, value, color = "blue", hint, symbol = "◈" }) => (
        <section key={label} className={compact ? `${panel} !p-4 sm:!p-4` : panel}>
          <div className={`${compact ? "mb-2" : "mb-4"} flex items-center gap-3`}>
            <span
              aria-hidden="true"
              className={`grid ${compact ? "size-8 text-base" : "size-10 text-xl"} shrink-0 place-items-center rounded-xl ${colors[color]}`}
            >
              {symbol}
            </span>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {label}
            </h2>
          </div>
          <p className={`break-words font-extrabold tracking-tight tabular-nums ${compact ? "text-xl sm:text-2xl" : "text-2xl"}`}>
            {typeof value === "number" ? formatMoney(value) : value}
          </p>
          {hint && <p className={`mt-2 ${muted}`}>{hint}</p>}
        </section>
      ))}
    </div>
  );
}
