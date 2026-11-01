import { useEffect, useRef, useState } from "react";
import useYearPlan from "../hooks/useYearPlan";
import { buildYearSummary } from "../utils/yearSummary";
import { formatMoney } from "../utils/money.js";
import FinanceCards from "../components/finance/FinanceCards";
import { button } from "../components/finance/ui";
import YearGoalsDialog from "../components/finance/YearGoalsDialog";
import { useCategories } from "../context/CategoryContext";
import { yearlyAnalytics } from "../utils/summaryAnalytics";
import { IncomeExpenseBars, CumulativeChart, CategoryVisual, InsightStrip } from "../components/analytics/FinanceVisuals";

function YearContent({ transactions, userId, year, view, goalAddSignal = 0 }) {
  const { plan, error, loading, saveGoals } = useYearPlan(userId, year);
  const [editing, setEditing] = useState(null);
  const previousAddSignal = useRef(goalAddSignal);
  useEffect(() => {
    if (goalAddSignal !== previousAddSignal.current && view === "table") {
      const now = new Date();
      setEditing(year === now.getFullYear() ? now.getMonth() + 1 : 1);
    }
    previousAddSignal.current = goalAddSignal;
  }, [goalAddSignal, view, year]);
  const summary = buildYearSummary(transactions, year, plan);
  const analytics = yearlyAnalytics(transactions, year);
  const { getCategoryById } = useCategories();
  const cards = [
    { label: "Kế hoạch cả năm", value: summary.target, color: "blue" },
    { label: "Thực thu", value: summary.income, color: "green" },
    { label: "Chi tiêu", value: summary.expense, color: "red" },
    { label: "Tiết kiệm đã ghi nhận", value: summary.savings, color: "blue" },
    { label: "Tháng đạt mục tiêu", value: `${summary.reached} / ${summary.eligible}`, color: "amber" },
  ];
  return (
    <div className="grid gap-5">
      {error && (
        <p
          role="alert"
          className="m-0 rounded-xl bg-red-50 dark:bg-rose-950 p-4 text-sm text-red-700 dark:text-rose-400"
        >
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-slate-500">Đang tải kế hoạch năm từ Firebase…</p>}
      {view !== "table" && <>
      <FinanceCards compact items={cards} columns={5} />
      <InsightStrip items={[
        { label: "Chi tiêu trung bình mỗi tháng có phát sinh", value: formatMoney(analytics.averageExpense), note: `Tính trên ${analytics.monthsWithActivity} tháng có thu hoặc chi` },
        { label: "Tháng chi tiêu cao nhất", value: analytics.largestExpenseMonth ? `Tháng ${analytics.largestExpenseMonth.month}` : "Chưa có", note: analytics.largestExpenseMonth ? formatMoney(analytics.largestExpenseMonth.expense) : "" },
        { label: "Tỷ lệ chi / thu cả năm", value: summary.income > 0 ? `${Math.round(summary.expense / summary.income * 100)}%` : "Chưa có thu nhập", note: "Dựa trên các khoản thực tế đến hiện tại" },
      ]} />
      <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-2">
        <IncomeExpenseBars title={`Thu – chi 12 tháng năm ${year}`} subtitle="So sánh quy mô thu nhập và chi tiêu từng tháng" rows={analytics.rows} />
        <CategoryVisual title="Các danh mục chi lớn trong năm" categories={analytics.categories} getCategoryById={getCategoryById} />
      </div>
      <CumulativeChart title="Chênh lệch thu – chi lũy kế theo tháng" rows={analytics.accumulated} />
      <p className="m-0 text-sm text-slate-600 dark:text-slate-400">
        Chênh lệch thu − chi:{" "}
        <strong
          className={
            summary.balance < 0
              ? "text-red-700 dark:text-rose-400"
              : "text-green-700 dark:text-emerald-400"
          }
        >
          {formatMoney(summary.balance)}
        </strong>
        . Số tháng đạt chỉ tính tháng đã đến kỳ và có mục tiêu lớn hơn 0.
      </p>
      </>}
      {view === "table" && <>
      <FinanceCards compact columns={5} items={[
        { label: "Mục tiêu thu nhập", value: summary.target, color: "blue" },
        { label: "Thực thu", value: summary.income, color: "green" },
        { label: "Chi tiêu", value: summary.expense, color: "red" },
        { label: "Mục tiêu tiết kiệm", value: summary.savingsTarget, color: "amber" },
        { label: "Đã tiết kiệm", value: summary.savings, color: "green" },
      ]}/>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
        <div><p className="font-bold">Bảng chi tiết 12 tháng · {year}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Chênh lệch cả năm: <strong className={summary.balance < 0 ? "text-rose-600" : "text-emerald-600"}>{formatMoney(summary.balance)}</strong></p></div>
        <span className="text-xs text-slate-500 dark:text-slate-400">Chọn Sửa để cập nhật mục tiêu của tháng.</span>
      </div>
      {editing !== null && !loading && !error && (
        <YearGoalsDialog
          key={`${year}-${editing}`}
          year={year}
          rows={summary.rows}
          initialMonth={editing}
          onSave={saveGoals}
          onClose={() => setEditing(null)}
        />
      )}
      <div className="max-w-full min-w-0 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full min-w-[980px] border-collapse text-sm tabular-nums">
          <caption className="p-4 text-left font-bold text-slate-800 dark:text-slate-200">
            Tổng kết 12 tháng · Đơn vị: đồng
          </caption>
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <tr>
              {[
                "Tháng",
                "Dự tính thu",
                "Thực thu",
                "Chi tiêu",
                "Mục tiêu TK",
                "Đã tiết kiệm",
                "Chênh lệch",
                "Tiến độ",
                "",
              ].map((label, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-4 py-3 text-left whitespace-nowrap"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((row) => (
              <tr
                key={row.month}
                className={`border-t border-slate-100 dark:border-slate-800 ${row.future ? "bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-300"}`}
              >
                <th
                  scope="row"
                  className="px-4 py-4 text-left whitespace-nowrap"
                >
                  Tháng {row.month}
                </th>
                <td className="px-4 py-4 whitespace-nowrap">
                  {row.target === null ? "—" : formatMoney(row.target)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {row.future ? "—" : formatMoney(row.income)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {row.future ? "—" : formatMoney(row.expense)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">{row.savingsTarget === null ? "—" : formatMoney(row.savingsTarget)}</td>
                <td className="px-4 py-4 whitespace-nowrap">{row.future ? "—" : formatMoney(row.savings)}</td>
                <td
                  className={`px-4 py-4 whitespace-nowrap ${row.balance < 0 ? "text-red-700 dark:text-rose-400" : ""}`}
                >
                  {row.future ? "—" : formatMoney(row.balance)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${row.reached ? "bg-green-100 dark:bg-emerald-950 text-green-800 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    aria-label={`Chỉnh tháng ${row.month}`}
                    onClick={() => setEditing(row.month)}
                    disabled={loading || Boolean(error)}
                    className={`${button} !min-h-9 !px-3 !py-1.5`}
                  >
                    Chỉnh
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Thực thu và chi tiêu lấy từ giao dịch đã nhập đến hôm nay, không gồm
        giao dịch mang ngày tương lai. Kế hoạch và tiết kiệm được đồng bộ trên Firebase theo năm. Tiết kiệm chưa phải
        số dư của ví tiết kiệm.
      </p>
      </>}
    </div>
  );
}

export default function YearSummaryPage({
  transactions = [],
  userId,
  year = new Date().getFullYear(),
  view = "analytics",
  goalAddSignal = 0,
}) {
  return (
    <section className="grid min-w-0 gap-6 text-slate-800 dark:text-slate-200">
      <YearContent
        key={`${userId || "local"}:${year}`}
        transactions={transactions}
        userId={userId}
        year={year}
        view={view}
        goalAddSignal={goalAddSignal}
      />
    </section>
  );
}
