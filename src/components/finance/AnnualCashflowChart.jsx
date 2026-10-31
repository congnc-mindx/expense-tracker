import { useMemo } from "react";
import { annualCashflow } from "../../utils/annualCashflow";
import { formatMoney } from "../../utils/money";
import { muted, panel } from "./ui";

const axisNumber = (amount) => {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}tr`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(Math.round(amount));
};

export default function AnnualCashflowChart({ transactions, selectedMonth, onMonthChange }) {
  const year = Number(selectedMonth.slice(0, 4));
  const { months, income, expense, balance, scale } = useMemo(
    () => annualCashflow(transactions, year),
    [transactions, year],
  );
  const activeMonth = months.find((month) => month.key === selectedMonth) || months[0];
  const hasData = income > 0 || expense > 0;

  return (
    <section className={panel} aria-labelledby="annual-cashflow-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="annual-cashflow-title" className="text-lg font-bold tracking-tight sm:text-xl">
            Biểu đồ Thu – Chi năm {year}
          </h2>
          <p className={`mt-1 ${muted}`}>Chọn một tháng trên biểu đồ để xem chi tiết tháng đó.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-[#f3f8f4] px-3 py-2 text-xs font-bold dark:bg-slate-800 sm:text-sm">
          <span className="inline-flex items-center gap-2"><i className="size-2.5 rounded-full bg-[#47996b] dark:bg-emerald-400" aria-hidden="true" />Thu nhập</span>
          <span className="inline-flex items-center gap-2"><i className="size-2.5 rounded-full bg-[#ea7562] dark:bg-rose-400" aria-hidden="true" />Chi tiêu</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-b border-[#e2eee5] pb-4 dark:border-slate-800 sm:flex sm:flex-wrap sm:gap-8">
        <div><p className={`text-xs ${muted}`}>Tổng thu năm</p><p className="mt-1 text-sm font-extrabold tabular-nums text-[#378355] dark:text-emerald-400 sm:text-base">{formatMoney(income)}</p></div>
        <div><p className={`text-xs ${muted}`}>Tổng chi năm</p><p className="mt-1 text-sm font-extrabold tabular-nums text-[#dc6857] dark:text-rose-400 sm:text-base">{formatMoney(expense)}</p></div>
        <div className="col-span-2"><p className={`text-xs ${muted}`}>Chênh lệch năm</p><p className={`mt-1 text-sm font-extrabold tabular-nums sm:text-base ${balance < 0 ? "text-rose-600 dark:text-rose-400" : "text-[#378355] dark:text-emerald-400"}`}>{formatMoney(balance)}</p></div>
      </div>

      <div className="mt-6 grid grid-cols-[42px_minmax(0,1fr)] gap-2 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-3">
        <div aria-hidden="true" className="flex h-52 flex-col justify-between pb-0 text-right text-[10px] font-medium tabular-nums text-slate-400 dark:text-slate-500 sm:h-60 sm:text-xs">
          <span>{axisNumber(scale)}</span><span>{axisNumber(scale * .75)}</span><span>{axisNumber(scale * .5)}</span><span>{axisNumber(scale * .25)}</span><span>0</span>
        </div>
        <div className="min-w-0">
          <div className="relative h-52 sm:h-60">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((line) => <div key={line} className="w-full border-t border-dashed border-[#e2eee5] dark:border-slate-700/70" />)}
            </div>
            <div className="relative grid h-full grid-cols-12 items-end gap-0.5 sm:gap-1.5">
              {months.map((month) => {
                const selected = selectedMonth === month.key;
                const incomeHeight = (month.income / scale) * 100;
                const expenseHeight = (month.expense / scale) * 100;
                return (
                  <button
                    key={month.key}
                    type="button"
                    title={`Tháng ${month.month}/${year} · Thu: ${formatMoney(month.income)} · Chi: ${formatMoney(month.expense)}`}
                    aria-label={`Tháng ${month.month}: thu nhập ${formatMoney(month.income)}, chi tiêu ${formatMoney(month.expense)}. Chọn tháng này`}
                    aria-pressed={selected}
                    onClick={() => onMonthChange(month.key)}
                    className={`group relative flex h-full min-w-0 cursor-pointer items-end justify-center gap-[2px] rounded-t-lg px-[1px] pb-[1px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:focus-visible:outline-blue-400 sm:gap-1 ${selected ? "bg-[#e8f4eb] dark:bg-blue-500/10" : "hover:bg-[#f2f8f4] dark:hover:bg-slate-700/40"}`}
                  >
                    <span aria-hidden="true" className="w-[38%] max-w-5 rounded-t-[3px] bg-[#47996b] transition-[height,filter] duration-300 group-hover:brightness-110 dark:bg-emerald-400" style={{ height: `${incomeHeight}%` }} />
                    <span aria-hidden="true" className="w-[38%] max-w-5 rounded-t-[3px] bg-[#ea7562] transition-[height,filter] duration-300 group-hover:brightness-110 dark:bg-rose-400" style={{ height: `${expenseHeight}%` }} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-2 grid grid-cols-12 gap-0.5 sm:gap-1.5">
            {months.map((month) => <div key={month.key} className={`min-w-0 text-center text-[10px] font-semibold sm:text-xs ${selectedMonth === month.key ? "text-[#2f8151] dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>T{month.month}</div>)}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-[#e2eee5] pt-4 text-xs dark:border-slate-800 sm:text-sm">
        <span className="font-semibold">Tháng {activeMonth.month}/{year} đang chọn</span>
        <span className="flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
          <span className="text-[#378355] dark:text-emerald-400">Thu: {formatMoney(activeMonth.income)}</span>
          <span className="text-[#dc6857] dark:text-rose-400">Chi: {formatMoney(activeMonth.expense)}</span>
        </span>
      </div>
      {!hasData && <p className={`mt-3 text-center text-xs ${muted}`}>Chưa có khoản thu hoặc chi thực tế trong năm này.</p>}
    </section>
  );
}
