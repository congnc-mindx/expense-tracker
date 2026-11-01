import useIncrementalList from "../components/common/useIncrementalList";
import LoadMoreButton from "../components/common/LoadMoreButton";
import YearSummaryPage from "./YearSummaryPage";
import FinanceCards from "../components/finance/FinanceCards";
import { button, primary, panel } from "../components/finance/ui";
import { monthRows, totals, isActual } from "../utils/finance";
import { useCategories } from "../context/CategoryContext";
import { formatMoney } from "../utils/money.js";
import { monthlyAnalytics } from "../utils/summaryAnalytics";
import { IncomeExpenseBars, CumulativeChart, CategoryVisual, InsightStrip } from "../components/analytics/FinanceVisuals";

export default function SummaryPage({
  transactions,
  userId,
  month,
  mode,
  onModeChange,
  year,
}) {
  const { getCategoryById } = useCategories();
  const rows = monthRows(transactions, month).filter((tx) => isActual(tx));
  const { income, expense } = totals(rows);
  const analytics = monthlyAnalytics(transactions, month);
  const categories = [...new Set(rows.map((tx) => tx.category))]
    .map((id) => ({
      ...getCategoryById(id),
      amount: rows
        .filter((tx) => tx.category === id)
        .reduce((sum, tx) => sum + tx.amount, 0),
      type: rows.find((tx) => tx.category === id).type,
    }))
    .sort((a, b) => b.amount - a.amount);
  const paging = useIncrementalList(categories, [month,mode], 10);
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={mode === "month"}
          className={mode === "month" ? primary : button}
          onClick={() => onModeChange("month")}
        >
          Theo tháng
        </button>
        <button
          type="button"
          aria-pressed={mode === "year"}
          className={mode === "year" ? primary : button}
          onClick={() => onModeChange("year")}
        >
          Theo năm
        </button>
        <button
          type="button"
          aria-pressed={mode === "twelve"}
          className={mode === "twelve" ? primary : button}
          onClick={() => onModeChange("twelve")}
        >
          12 tháng
        </button>
      </div>
      {["year", "twelve"].includes(mode) ? (
        <YearSummaryPage
          transactions={transactions.filter((tx) => tx.status !== "planned")}
          userId={userId}
          year={year}
          view={mode === "twelve" ? "table" : "analytics"}
        />
      ) : (
        <>
          <FinanceCards compact
            items={[
              { label: "Thực thu", value: income, color: "green" },
              { label: "Thực chi", value: expense, color: "red" },
              { label: "Chênh lệch", value: income - expense },
              {
                label: "Tỷ lệ chi / thu",
                value:
                  income > 0
                    ? `${Math.round((expense / income) * 100)}%`
                    : "Chưa có thu nhập",
                color: "amber",
              },
            ]}
          />
          <InsightStrip items={[
            { label: "Giao dịch thực tế", value: `${analytics.count} khoản`, note: "Không gồm các khoản dự kiến" },
            { label: "Chi tiêu so với tháng trước", value: analytics.previousExpense > 0 ? `${analytics.expense >= analytics.previousExpense ? "+" : ""}${Math.round((analytics.expense / analytics.previousExpense - 1) * 100)}%` : "Chưa có kỳ đối chiếu", note: analytics.previousExpense > 0 ? `Tháng trước: ${formatMoney(analytics.previousExpense)}` : "Cần có chi tiêu ở tháng trước" },
            { label: "Danh mục chi nhiều nhất", value: analytics.categories.length ? getCategoryById(analytics.categories[0].id).name : "Chưa có", note: analytics.categories.length ? formatMoney(analytics.categories[0].amount) : "" },
          ]} />
          <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-2">
            <IncomeExpenseBars title="Thu – chi theo tuần" subtitle="Các khoảng 7 ngày trong tháng đang chọn" rows={analytics.periods} compact />
            <CategoryVisual title="Chi tiêu theo danh mục" categories={analytics.categories} getCategoryById={getCategoryById} />
          </div>
          <CumulativeChart title="Xu hướng chênh lệch cộng dồn theo ngày" rows={analytics.daily} />
          <section className={panel}>
            <h2 className="mb-5 font-bold">Chi tiết theo danh mục</h2>
            {categories.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {paging.visible.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between gap-4 py-4 text-sm"
                  >
                    <span>
                      {cat.icon} {cat.name}
                    </span>
                    <span
                      className={`text-right font-bold tabular-nums ${cat.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                    >
                      {cat.type === "income" ? "+" : "−"}
                      {formatMoney(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Chưa có giao dịch thực tế trong tháng này.
              </p>
            )}
            <LoadMoreButton remaining={paging.remaining} batch={10} onClick={paging.loadMore} noun="danh mục" />
          </section>
        </>
      )}
    </div>
  );
}
