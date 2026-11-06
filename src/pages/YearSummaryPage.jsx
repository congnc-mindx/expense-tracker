import { useEffect, useRef, useState } from "react";
import useYearPlan from "../hooks/useYearPlan";
import { buildYearSummary } from "../utils/yearSummary";
import { goalProgressForYear } from "../utils/yearGoals";
import { formatMoney } from "../utils/money.js";
import FinanceCards from "../components/finance/FinanceCards";
import YearGoalsDialog from "../components/finance/YearGoalsDialog";
import { button } from "../components/finance/ui";
import { useCategories } from "../context/CategoryContext";
import { yearlyAnalytics } from "../utils/summaryAnalytics";
import { IncomeExpenseBars, CumulativeChart, CategoryVisual, InsightStrip } from "../components/analytics/FinanceVisuals";

function YearContent({ transactions, userId, year, view, goalAddSignal = 0 }) {
  const { plan, error, loading, saveGoals } = useYearPlan(userId, year);
  const [editingMonth, setEditingMonth] = useState(null);
  const previousAddSignal = useRef(goalAddSignal);
  useEffect(() => {
    if (goalAddSignal === previousAddSignal.current) return;
    previousAddSignal.current = goalAddSignal;
    if (view === "table") {
      const currentDate = new Date();
      setEditingMonth(year === currentDate.getFullYear() ? currentDate.getMonth() + 1 : 1);
    }
  }, [goalAddSignal, view, year]);
  const summary = buildYearSummary(transactions, year, plan);
  const progress = goalProgressForYear(summary.rows);
  const analytics = yearlyAnalytics(transactions, year);
  const { getCategoryById } = useCategories();
  const cards = [
    { label: "Thực thu", value: summary.income, color: "green" },
    { label: "Thực chi", value: summary.expense, color: "red" },
    { label: "Chênh lệch thu – chi", value: summary.balance, color: summary.balance < 0 ? "red" : "green" },
    { label: "Tỷ lệ chi / thu", value: summary.income > 0 ? `${Math.round(summary.expense / summary.income * 100)}%` : "Chưa có thu nhập", color: "amber" },
  ];

  return (
    <div className="grid gap-5">
      {error && (
        <p role="alert" className="m-0 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-rose-950 dark:text-rose-400">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-slate-500">Đang tải kế hoạch năm từ Firebase…</p>}
      {view !== "table" && <>
        <FinanceCards compact items={cards} columns={4} />
        <InsightStrip items={[
          { label: "Chi tiêu trung bình mỗi tháng có phát sinh", value: formatMoney(analytics.averageExpense), note: `Tính trên ${analytics.monthsWithActivity} tháng có thu hoặc chi` },
          { label: "Tháng chi tiêu cao nhất", value: analytics.largestExpenseMonth ? `Tháng ${analytics.largestExpenseMonth.month}` : "Chưa có", note: analytics.largestExpenseMonth ? formatMoney(analytics.largestExpenseMonth.expense) : "" },
          { label: "Tháng có thu nhập cao nhất", value: analytics.rows.some((r) => r.income > 0) ? `Tháng ${analytics.rows.reduce((best, row) => row.income > best.income ? row : best, analytics.rows[0]).month}` : "Chưa có", note: analytics.rows.some((r) => r.income > 0) ? formatMoney(Math.max(...analytics.rows.map((r) => r.income))) : "" },
        ]} />
        <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-2">
          <IncomeExpenseBars title={`Thu – chi 12 tháng năm ${year}`} subtitle="So sánh quy mô thu nhập và chi tiêu từng tháng" rows={analytics.rows} />
          <CategoryVisual title="Các danh mục chi lớn trong năm" categories={analytics.categories} getCategoryById={getCategoryById} />
        </div>
        <CumulativeChart title="Chênh lệch thu – chi lũy kế theo tháng" rows={analytics.accumulated} />
        <p className="m-0 text-sm text-slate-600 dark:text-slate-400">
          Chênh lệch thu − chi:{" "}
          <strong className={summary.balance < 0 ? "text-red-700 dark:text-rose-400" : "text-green-700 dark:text-emerald-400"}>
            {formatMoney(summary.balance)}
          </strong>
          . Số liệu năm chỉ bao gồm thu và chi thực tế đã phát sinh.
        </p>
      </>}
      {view === "table" && <>
        <FinanceCards compact columns={4} items={[
          { label: "Tháng đã đặt mục tiêu", value: `${progress.defined} / 12`, color: "blue" },
          { label: "Tháng đạt thu nhập", value: `${progress.reached} / ${progress.eligible}`, color: "green" },
          { label: "Tiến độ thu nhập", value: progress.incomeProgress, color: "blue" },
          { label: "Tiến độ tiết kiệm", value: progress.savingsProgress, color: "amber" },
        ]} />
        <div className="max-w-full min-w-0 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[900px] border-collapse text-sm tabular-nums">
            <caption className="p-4 text-left font-bold text-slate-800 dark:text-slate-200">
              Mục tiêu 12 tháng · Đơn vị: đồng
            </caption>
            <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                {[
                  "Tháng",
                  "Dự tính thu",
                  "Thực thu",
                  "Chi tiêu",
                  "Mục tiêu TK",
                  "Đã tiết kiệm",
                  "Chênh lệch",
                  "Đạt mục tiêu",
                  "Thao tác",
                ].map((label) => (
                  <th key={label} scope="col" className="px-4 py-3 text-left whitespace-nowrap">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.rows.map((row) => (
                <tr key={row.month} className={`border-t border-slate-100 dark:border-slate-800 ${row.future ? "bg-slate-50 text-slate-400 dark:bg-slate-950 dark:text-slate-500" : "text-slate-700 dark:text-slate-300"}`}>
                  <th scope="row" className="px-4 py-4 text-left whitespace-nowrap">Tháng {row.month}</th>
                  <td className="px-4 py-4 whitespace-nowrap">{row.target === null ? "—" : formatMoney(row.target)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{row.future ? "—" : formatMoney(row.income)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{row.future ? "—" : formatMoney(row.expense)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{row.savingsTarget === null ? "—" : formatMoney(row.savingsTarget)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{row.future ? "—" : formatMoney(row.savings)}</td>
                  <td className={`px-4 py-4 whitespace-nowrap ${row.balance < 0 ? "text-red-700 dark:text-rose-400" : ""}`}>{row.future ? "—" : formatMoney(row.balance)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.reached ? "bg-green-100 text-green-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <button type="button" className={`${button} !min-h-8 !rounded-lg !px-3 !py-1.5 !text-xs`}
                      onClick={() => setEditingMonth(row.month)} disabled={loading || Boolean(error)} aria-label={`Sửa mục tiêu tháng ${row.month}`}>
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Đối chiếu theo tháng. Tháng chưa tới kỳ không bị đánh giá là chưa đạt; tiền tiết kiệm là số bạn tự ghi nhận.
        </p>
        {editingMonth !== null && !loading && !error && (
          <YearGoalsDialog key={`${year}-${editingMonth}`} year={year} rows={summary.rows} initialMonth={editingMonth}
            onSave={saveGoals} onClose={() => setEditingMonth(null)} />
        )}
      </>}
    </div>
  );
}

export default function YearSummaryPage({ transactions = [], userId, year = new Date().getFullYear(), view = "analytics", goalAddSignal = 0 }) {
  return (
    <section className="grid min-w-0 gap-6 text-slate-800 dark:text-slate-200">
      <YearContent key={`${userId || "local"}:${year}:${view}`} transactions={transactions} userId={userId} year={year} view={view} goalAddSignal={goalAddSignal} />
    </section>
  );
}
