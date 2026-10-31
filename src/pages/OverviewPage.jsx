import FinanceCards from "../components/finance/FinanceCards";
import AnnualCashflowChart from "../components/finance/AnnualCashflowChart";
import TransactionList from "../components/finance/TransactionList";
import { button, muted, panel } from "../components/finance/ui";
import { useCategories } from "../context/CategoryContext";
import { isActual, totals } from "../utils/finance";
import { formatMoney } from "../utils/money.js";

// Colors are assigned by stable group ID: renaming a group does not recolor its history.
const GROUP_VISUALS = {
  essential: { icon: "⌂", color: "#e89a35", background: "#fff3e1" },
  relationships: { icon: "♡", color: "#329c69", background: "#e6f5eb" },
  personal: { icon: "✦", color: "#9571ca", background: "#f1eafb" },
  activities: { icon: "✈", color: "#438fc4", background: "#e8f4fc" },
  other: { icon: "▤", color: "#84949e", background: "#edf1f5" },
};
const EXTRA_VISUALS = [
  { icon: "●", color: "#df796d", background: "#fdf0ed" },
  { icon: "◆", color: "#3d9c9b", background: "#e3f4f2" },
  { icon: "◈", color: "#b08a35", background: "#fbf5e4" },
];

function groupBreakdown(rows, groups, getCategoryById) {
  const actualExpenses = rows.filter((tx) => tx.type === "expense" && isActual(tx));
  const grouped = new Map();
  for (const tx of actualExpenses) {
    const groupId = getCategoryById(tx.category).groupId;
    const previous = grouped.get(groupId) || { amount: 0, count: 0 };
    grouped.set(groupId, {
      amount: previous.amount + (Number(tx.amount) || 0),
      count: previous.count + 1,
    });
  }
  const data = groups.map((group, index) => ({
    ...group,
    ...(grouped.get(group.id) || { amount: 0, count: 0 }),
    visual: GROUP_VISUALS[group.id] || EXTRA_VISUALS[index % EXTRA_VISUALS.length],
  }));
  return {
    expenses: actualExpenses,
    groups: data.filter((group) => group.amount > 0).sort((a, b) => b.amount - a.amount),
  };
}

function DonutChart({ groups, expense, count }) {
  let current = 0;
  const stops = groups.map((group) => {
    const start = current;
    current += (group.amount / expense) * 100;
    return `${group.visual.color} ${start.toFixed(2)}% ${Math.min(current, 100).toFixed(2)}%`;
  });
  const background = stops.length
    ? `conic-gradient(${stops.join(", ")})`
    : "conic-gradient(#e0eae3 0% 100%)";

  return (
    <div
      role="img"
      aria-label={`Biểu đồ phân bổ ${formatMoney(expense)} chi tiêu theo ${groups.length} nhóm`}
      className="relative mx-auto grid aspect-square w-[184px] shrink-0 place-items-center rounded-full p-[17px] sm:w-[208px]"
      style={{ background }}
    >
      <div className="flex size-full flex-col items-center justify-center rounded-full bg-white px-2 text-center shadow-[inset_0_2px_6px_rgba(28,81,48,0.06)] dark:bg-slate-900">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng chi tháng</span>
        <strong className="mt-1 max-w-full break-all text-[15px] font-extrabold tabular-nums leading-snug text-[#28583b] dark:text-white sm:text-base">
          {formatMoney(expense)}
        </strong>
        <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{count} khoản</span>
      </div>
    </div>
  );
}

function ExpenseByGroup({ rows, expense, groups, getCategoryById }) {
  const breakdown = groupBreakdown(rows, groups, getCategoryById);
  return (
    <section className={panel} aria-labelledby="overview-category-title">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="overview-category-title" className="text-lg font-bold tracking-tight sm:text-xl">Chi tiêu theo nhóm</h2>
          <p className={`mt-1 ${muted}`}>Phân bổ chi tiêu tháng này theo từng nhóm danh mục</p>
        </div>
        <span className="rounded-full bg-[#eaf5ed] px-3 py-1.5 text-xs font-bold text-[#35714b] dark:bg-slate-800 dark:text-slate-300">
          {breakdown.groups.length} nhóm có phát sinh
        </span>
      </div>

      {breakdown.groups.length ? (
        <div className="grid min-w-0 items-center gap-7 lg:grid-cols-[220px_minmax(0,1fr)] xl:gap-9">
          <DonutChart groups={breakdown.groups} expense={expense} count={breakdown.expenses.length} />
          <div className="grid min-w-0 gap-x-8 gap-y-5 sm:grid-cols-2">
            {breakdown.groups.map((group) => {
              const percentage = expense ? (group.amount / expense) * 100 : 0;
              return (
                <div key={group.id} className="min-w-0">
                  <div className="mb-2 flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-xl text-xl font-bold"
                      style={{ color: group.visual.color, backgroundColor: group.visual.background }}
                    >
                      {group.visual.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold" title={group.name}>{group.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{group.count} khoản</p>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold tabular-nums" style={{ color: group.visual.color }}>
                      {Math.round(percentage)}%
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`Tỷ trọng nhóm ${group.name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(percentage)}
                    className="h-2 overflow-hidden rounded-full bg-[#eaf0ec] dark:bg-slate-800"
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{ width: `${Math.min(percentage, 100)}%`, background: group.visual.color }}
                    />
                  </div>
                  <p className="mt-1.5 text-right text-sm font-bold tabular-nums">{formatMoney(group.amount)}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#dbe8df] bg-[#f8fbf9] px-4 text-center dark:border-slate-700 dark:bg-slate-950/30">
          <span aria-hidden="true" className="text-3xl text-[#8cad98]">◌</span>
          <p className="text-sm font-semibold">Chưa có khoản chi trong tháng này</p>
          <p className={`text-xs ${muted}`}>Biểu đồ sẽ cập nhật khi bạn ghi nhận một khoản chi.</p>
        </div>
      )}
    </section>
  );
}

function BudgetOverview({ expense, budget, uncategorized, onNavigate }) {
  const total = Number(budget?.total) || 0;
  const hasBudget = total > 0;
  const percentage = hasBudget ? Math.round((expense / total) * 100) : 0;
  const exceeded = hasBudget && expense > total;
  const difference = total - expense;

  return (
    <section className={`${panel} flex min-w-0 flex-col`} aria-labelledby="overview-budget-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="overview-budget-title" className="text-lg font-bold tracking-tight">Tiến độ ngân sách</h2>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${exceeded
          ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
          : "bg-[#eaf5ed] text-[#35714b] dark:bg-slate-800 dark:text-slate-300"}`}>
          {hasBudget ? (exceeded ? "Vượt hạn mức" : "Trong hạn mức") : "Chưa đặt hạn mức"}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
        <p className={`text-4xl font-black tracking-tight tabular-nums sm:text-5xl ${exceeded ? "text-rose-600 dark:text-rose-400" : "text-[#368453] dark:text-blue-400"}`}>
          {hasBudget ? `${percentage}%` : "—"}
        </p>
        <span className={`pb-1 text-sm ${muted}`}>đã sử dụng</span>
      </div>
      <p className={`mt-2 text-sm tabular-nums ${muted}`}>
        {hasBudget ? `${formatMoney(expense)} / ${formatMoney(total)}` : "Đặt ngân sách để theo dõi giới hạn chi tiêu."}
      </p>
      <div
        role="progressbar"
        aria-label="Ngân sách đã sử dụng"
        aria-valuemin={0}
        aria-valuemax={Math.max(100, percentage)}
        aria-valuenow={percentage}
        className="mt-5 h-3 overflow-hidden rounded-full bg-[#e9f1eb] dark:bg-slate-800"
      >
        <div className={`h-full rounded-full transition-[width] duration-300 ${exceeded ? "bg-rose-500" : "bg-[#4caa71] dark:bg-blue-500"}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>

      {hasBudget && (
        <div className="mt-5 grid min-w-0 grid-cols-2 gap-3">
          <div className="min-w-0 rounded-xl bg-[#f3f8f4] p-3 dark:bg-slate-950/50">
            <p className={`text-xs ${muted}`}>Đã chi</p>
            <p className="mt-1 break-words text-sm font-bold tabular-nums">{formatMoney(expense)}</p>
          </div>
          <div className="min-w-0 rounded-xl bg-[#e9f6ec] p-3 dark:bg-slate-950/50">
            <p className={`text-xs ${muted}`}>{exceeded ? "Vượt ngân sách" : "Còn có thể chi"}</p>
            <p className={`mt-1 break-words text-sm font-bold tabular-nums ${exceeded ? "text-rose-600 dark:text-rose-400" : "text-[#2f8651] dark:text-emerald-400"}`}>
              {formatMoney(Math.abs(difference))}
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={button} onClick={() => onNavigate("budget")}>Quản lý ngân sách <span aria-hidden="true">↗</span></button>
        {uncategorized > 0 && <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{uncategorized} khoản cần phân loại</span>}
      </div>
    </section>
  );
}

function RecentTransactions({ recent, onNavigate }) {
  return (
    <section className={`${panel} min-w-0`} aria-labelledby="overview-recent-title">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 id="overview-recent-title" className="text-lg font-bold tracking-tight">Giao dịch gần đây</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={button} onClick={() => onNavigate("expense")}>Khoản chi</button>
          <button type="button" className={button} onClick={() => onNavigate("income")}>Khoản thu</button>
        </div>
      </div>
      <TransactionList rows={recent} onSocialNavigate={() => onNavigate("social")} />
    </section>
  );
}

export default function OverviewPage({ rows, allTransactions, month, onMonthChange, budget, onNavigate }) {
  const { groups, getCategoryById } = useCategories();
  const { income, expense } = totals(rows);
  const recent = [...rows]
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) ||
      Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .slice(0, 5);
  const uncategorized = rows.filter((tx) => tx.type === "expense" && isActual(tx) && tx.category === "other_expense").length;

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <FinanceCards items={[
        { label: "Thu đã nhận", value: income, color: "green", symbol: "↙" },
        { label: "Tổng chi", value: expense, color: "red", symbol: "↗" },
        { label: "Chênh lệch thu − chi", value: income - expense, hint: "Chưa phải số dư tài khoản" },
        { label: "Ngân sách còn lại", value: Number(budget?.total) > 0 ? budget.total - expense : "Chưa đặt", color: "amber", symbol: "◎" },
      ]} />

      <AnnualCashflowChart transactions={allTransactions} selectedMonth={month} onMonthChange={onMonthChange} />

      <ExpenseByGroup rows={rows} expense={expense} groups={groups} getCategoryById={getCategoryById} />

      {/* Large screens: budget 40% on the left, recent transactions 60% on the right. */}
      <div className="grid min-w-0 items-stretch gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6">
        <BudgetOverview expense={expense} budget={budget} uncategorized={uncategorized} onNavigate={onNavigate} />
        <RecentTransactions recent={recent} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
