import FinanceCards from "../components/finance/FinanceCards";
import TransactionList from "../components/finance/TransactionList";
import { panel, muted, button } from "../components/finance/ui";
import { useCategories } from "../context/CategoryContext";
import { isActual, totals } from "../utils/finance";
import { formatMoney } from "../utils/money.js";

export default function OverviewPage({ rows, budget, onNavigate }) {
  const { groups: EXPENSE_GROUPS, getCategoryById } = useCategories();
  const { income, expense } = totals(rows);
  const groups = EXPENSE_GROUPS.map((group) => ({
    ...group,
    amount: rows
      .filter(
        (tx) =>
          tx.type === "expense" &&
          isActual(tx) &&
          getCategoryById(tx.category).groupId === group.id,
      )
      .reduce((sum, tx) => sum + tx.amount, 0),
  }))
    .filter((group) => group.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const recent = [...rows]
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0),
    )
    .slice(0, 5);
  const uncategorized = rows.filter(
    (tx) => tx.type === "expense" && tx.category === "other_expense",
  ).length;
  const ratio = budget.total > 0 ? expense / budget.total : 0;
  return (
    <div className="grid gap-6">
      <FinanceCards
        items={[
          { label: "Thu đã nhận", value: income, color: "green", symbol: "↙" },
          { label: "Tổng chi", value: expense, color: "red", symbol: "↗" },
          {
            label: "Chênh lệch thu − chi",
            value: income - expense,
            hint: "Chưa phải số dư tài khoản",
          },
          {
            label: "Ngân sách còn lại",
            value: budget.total > 0 ? budget.total - expense : "Chưa đặt",
            color: "amber",
            symbol: "◎",
          },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className={panel}>
          <h2 className="mb-5 font-bold">Chi tiêu theo nhóm</h2>
          {groups.length ? (
            <div className="grid gap-5">
              {groups.map((group) => (
                <div key={group.id}>
                  <div className="mb-2 flex justify-between gap-4 text-sm">
                    <span>{group.name}</span>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(group.amount)} ·{" "}
                      {Math.round((group.amount / expense) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(group.amount / expense) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`py-8 ${muted}`}>
              Chưa có khoản chi thực tế trong tháng.
            </p>
          )}
        </section>
        <section className={panel}>
          <h2 className="mb-5 font-bold">Tiến độ ngân sách</h2>
          <p className="text-3xl font-extrabold">
            {budget.total > 0
              ? `${Math.round(ratio * 100)}%`
              : "Chưa đặt hạn mức"}
          </p>
          <p className={`mt-2 ${muted}`}>
            {budget.total > 0
              ? `${formatMoney(expense)} / ${formatMoney(budget.total)}`
              : "Đặt ngân sách để biết tháng này còn có thể chi bao nhiêu."}
          </p>
          <div className="my-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full ${ratio > 1 ? "bg-rose-500" : "bg-blue-500"}`}
              style={{ width: `${Math.min(ratio * 100, 100)}%` }}
            />
          </div>
          {ratio > 1 && (
            <p className="mb-4 text-sm text-rose-600 dark:text-rose-400">
              Vượt ngân sách {formatMoney(expense - budget.total)}
            </p>
          )}
          <button
            type="button"
            className={button}
            onClick={() => onNavigate("budget")}
          >
            Quản lý ngân sách
          </button>
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
            <p className="font-semibold">{uncategorized} khoản cần phân loại</p>
            <p className={`mt-1 ${muted}`}>
              Các khoản đang lưu trong danh mục “Cần phân loại”.
            </p>
          </div>
        </section>
      </div>
      <section className={panel}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">Giao dịch gần đây</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className={button}
              onClick={() => onNavigate("expense")}
            >
              Xem khoản chi
            </button>
            <button
              type="button"
              className={button}
              onClick={() => onNavigate("income")}
            >
              Xem khoản thu
            </button>
          </div>
        </div>
        <TransactionList rows={recent} onSocialNavigate={() => onNavigate("social")}/>
      </section>
    </div>
  );
}
