import useYearPlan from "../hooks/useYearPlan";
import { buildYearSummary } from "../utils/yearSummary";
import { goalProgressForYear } from "../utils/yearGoals";
import { formatMoney } from "../utils/money.js";
import FinanceCards from "../components/finance/FinanceCards";
import { useCategories } from "../context/CategoryContext";
import { yearlyAnalytics } from "../utils/summaryAnalytics";
import { IncomeExpenseBars, CumulativeChart, CategoryVisual, InsightStrip } from "../components/analytics/FinanceVisuals";

function YearContent({ transactions, userId, year, view }) {
  const { plan, error, loading } = useYearPlan(userId, year);
  const summary = buildYearSummary(transactions, year, plan);
  const progress = goalProgressForYear(summary.rows);
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
        <p role="alert" className="m-0 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-rose-950 dark:text-rose-400">
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
          <strong className={summary.balance < 0 ? "text-red-700 dark:text-rose-400" : "text-green-700 dark:text-emerald-400"}>
            {formatMoney(summary.balance)}
          </strong>
          . Số tháng đạt chỉ tính tháng đã đến kỳ và có mục tiêu lớn hơn 0.
        </p>
      </>}
      {view === "table" && <>
        <FinanceCards compact columns={4} items={[
          { label: "Tháng đã đặt mục tiêu", value: `${progress.defined} / 12`, color: "blue" },
          { label: "Tháng đạt thu nhập", value: `${progress.reached} / ${progress.eligible}`, color: "green" },
          { label: "Tiến độ thu nhập", value: progress.incomeProgress, color: "blue" },
          { label: "Tiến độ tiết kiệm", value: progress.savingsProgress, color: "amber" },
        ]} />
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="font-bold">Bảng chi tiết 12 tháng · {year}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Chênh lệch cả năm: <strong className={summary.balance < 0 ? "text-rose-600" : "text-emerald-600"}>{formatMoney(summary.balance)}</strong></p>
          </div>
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Thiết lập mục tiêu được quản lý trong <strong>Cài đặt → Mục tiêu năm</strong>. Bảng giúp so sánh từng kỳ, khác với biểu đồ tổng hợp ở chế độ Theo năm.</p>
        </div>
        <div className="max-w-full min-w-0 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[900px] border-collapse text-sm tabular-nums">
            <caption className="p-4 text-left font-bold text-slate-800 dark:text-slate-200">
              Tổng kết 12 tháng · Đơn vị: đồng
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Số liệu được tính theo tháng, bao gồm các khoản tự động đến kỳ và thu nhập mindX đã đồng bộ. Các tháng tương lai chưa tính vào thực tế. Tiền tiết kiệm do bạn ghi nhận, không đồng nghĩa với số dư tài khoản.
        </p>
      </>}
    </div>
  );
}

export default function YearSummaryPage({ transactions = [], userId, year = new Date().getFullYear(), view = "analytics" }) {
  return (
    <section className="grid min-w-0 gap-6 text-slate-800 dark:text-slate-200">
      <YearContent key={`${userId || "local"}:${year}`} transactions={transactions} userId={userId} year={year} view={view} />
    </section>
  );
}
