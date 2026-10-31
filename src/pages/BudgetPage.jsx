import { useState } from "react";
import { useCategories } from "../context/CategoryContext";
import { panel, input, primary, muted, button } from "../components/finance/ui";
import { isActual } from "../utils/finance";
import { formatMoney } from "../utils/money.js";
import { formatVndAsThousands, parseThousandsToVnd, sanitizeThousandsInput } from "../utils/moneyInput.js";
import { getBudgetProgress } from "../utils/budgetProgress.js";

function BudgetCard({ name, spent, cap, onChange, onClear }) {
  const limit = parseThousandsToVnd(cap, { allowZero: true }) || 0;
  const progress = getBudgetProgress(spent, limit);
  const { percentage, exceeded } = progress;
  const remaining = Math.max(limit - spent, 0);
  return (
    <article className="grid gap-3 rounded-2xl border border-[#dce9df] bg-[#fbfdfb] p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold">{name}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Đã chi {formatMoney(spent)}</p>
        </div>
        <button type="button" disabled={!limit} className={`${button} !min-h-9 shrink-0 !px-3 !text-xs`} onClick={onClear}>Xóa hạn mức</button>
      </div>
      <label className="grid gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        Hạn mức danh mục (nghìn đồng)
        <input
          aria-label={`Hạn mức ${name}`}
          type="text"
          inputMode="decimal"
          placeholder="VD: 500"
          value={cap || ""}
          onChange={(e) => onChange(sanitizeThousandsInput(e.target.value))}
          className={`${input} !text-sm font-semibold`}
        />
      </label>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold">
          <span className={progress.textClass}>
            {limit > 0 ? `${percentage}% đã dùng` : "Chưa đặt hạn mức"}
          </span>
          {limit > 0 && (
            <span className={progress.textClass}>
              {exceeded ? `Vượt ${formatMoney(spent - limit)}` : `Còn ${formatMoney(remaining)}`}
            </span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e8f1ea] dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${progress.barClass}`}
            style={{ width: `${limit > 0 ? Math.min(percentage, 100) : 0}%` }}
          />
        </div>
      </div>
    </article>
  );
}

export default function BudgetPage({ budget, rows, onSave }) {
  const { expense: EXPENSE_CATEGORIES, getCategoryById } = useCategories();
  // Only the form uses thousands. The cloud budget remains VND as before.
  const [draft, setDraft] = useState(() => ({
    total: budget.total ? formatVndAsThousands(budget.total) : "",
    categories: Object.fromEntries(
      Object.entries(budget.categories || {}).map(([id, amount]) => [id, amount ? formatVndAsThousands(amount) : ""]),
    ),
  }));
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const amounts = {};
  rows
    .filter((tx) => tx.type === "expense" && isActual(tx))
    .forEach((tx) => {
      amounts[tx.category] = (amounts[tx.category] || 0) + tx.amount;
    });

  const total = parseThousandsToVnd(draft.total, { allowZero: true }) || 0;
  const spent = rows
    .filter((tx) => tx.type === "expense" && isActual(tx))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const remaining = Math.max(total - spent, 0);
  const exceeded = total > 0 && spent > total;
  const progress = getBudgetProgress(spent, total);
  const { percentage } = progress;
  const trackedCategories = EXPENSE_CATEGORIES.filter((c) => !c.hidden && !c.locked)
    .map((cat) => ({
      id: cat.id,
      name: getCategoryById(cat.id).name,
      spent: amounts[cat.id] || 0,
      cap: draft.categories?.[cat.id] || "",
    }))
    .sort((a, b) => (Number(Boolean(b.cap)) - Number(Boolean(a.cap))) || b.spent - a.spent || a.name.localeCompare(b.name, "vi"));

  function updateTotal(value) {
    setDraft((current) => ({ ...current, total: sanitizeThousandsInput(value) }));
    setMessage("");
  }
  function updateCategoryCap(id, value) {
    setDraft((current) => ({
      ...current,
      categories: { ...current.categories, [id]: sanitizeThousandsInput(value) },
    }));
    setMessage("");
  }
  function clearCategory(id) {
    setDraft((current) => ({
      ...current,
      categories: { ...current.categories, [id]: "" },
    }));
    setMessage("");
  }
  function resetAll() {
    if (typeof window !== "undefined" && !window.confirm("Xóa toàn bộ hạn mức trong tháng đang chọn? Các khoản chi thực tế vẫn được giữ nguyên.")) return;
    setDraft({ total: "", categories: {} });
    setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    const clean = {
      total: draft.total.trim() ? parseThousandsToVnd(draft.total, { allowZero: true }) : 0,
      categories: Object.fromEntries(
        Object.entries(draft.categories || {})
          .map(([id, value]) => [id, value.trim() ? parseThousandsToVnd(value, { allowZero: true }) : 0]),
      ),
    };
    try {
      if (
        ![clean.total, ...Object.values(clean.categories)].every(
          (n) => Number.isSafeInteger(n) && n >= 0,
        )
      ) {
        throw new Error("Hạn mức phải là số tiền hợp lệ theo nghìn đồng (VD: 355 = 355.000 đ).");
      }
      setSaving(true);
      await onSave(clean);
      setFailed(false);
      setMessage("Đã lưu ngân sách tháng này.");
    } catch (reason) {
      setFailed(true);
      setMessage(reason.message || "Chưa lưu được ngân sách.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <section className={`${panel} grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]`}>
        <div className="grid gap-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Ngân sách tháng đang chọn</h2>
            <p className={`mt-2 ${muted}`}>
              Đặt hạn mức chung và hạn mức theo danh mục. Bạn có thể sửa, xóa riêng từng hạn mức hoặc đặt lại toàn bộ tháng.
            </p>
          </div>
          <label className="grid max-w-lg gap-2 text-sm font-semibold">
            Tổng ngân sách tháng (nghìn đồng)
            <input
              type="text"
              inputMode="decimal"
              value={draft.total || ""}
              onChange={(e) => updateTotal(e.target.value)}
              placeholder="VD: 15.000 = 15.000.000 đ"
              className={`${input} !text-lg font-bold`}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {[5000000, 10000000, 15000000, 20000000].map((value) => (
              <button key={value} type="button" className={`${button} !min-h-10 !px-3`} onClick={() => updateTotal(formatVndAsThousands(value))}>
                {formatMoney(value)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl bg-[#eef7f0] p-4 dark:bg-slate-950/60">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đã chi thực tế</p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">{formatMoney(spent)}</p>
          </div>
          <div className="rounded-2xl bg-[#f6fbf7] p-4 dark:bg-slate-950/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tiến độ sử dụng</p>
                <p className={`mt-2 text-2xl font-extrabold tabular-nums ${progress.textClass}`}>
                  {total > 0 ? `${percentage}%` : "—"}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${progress.badgeClass}`}>
                {progress.shortLabel}
              </span>
            </div>
            <p className="mt-2 text-sm tabular-nums text-slate-500 dark:text-slate-400">
              {total > 0 ? `${formatMoney(spent)} / ${formatMoney(total)}` : "Đặt ngân sách tổng để theo dõi tiến độ."}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e3eee6] dark:bg-slate-800">
              <div className={`h-full rounded-full ${progress.barClass}`} style={{ width: `${total > 0 ? Math.min(percentage, 100) : 0}%` }} />
            </div>
            {total > 0 && (
              <p className={`mt-3 text-sm font-semibold ${progress.textClass}`}>
                {exceeded ? `Bạn đang vượt ${formatMoney(spent - total)}` : `Bạn còn có thể chi ${formatMoney(remaining)}`}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={panel}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Hạn mức theo danh mục</h2>
            <p className={`mt-2 ${muted}`}>Ưu tiên kiểm soát từng nhóm chi thường xuyên. Danh mục nào không cần quản lý riêng có thể để trống hoặc xóa hạn mức.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {trackedCategories.map((cat) => (
            <BudgetCard
              key={cat.id}
              name={cat.name}
              spent={cat.spent}
              cap={cat.cap}
              onChange={(value) => updateCategoryCap(cat.id, value)}
              onClear={() => clearCategory(cat.id)}
            />
          ))}
        </div>
      </section>

      <div className="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <p
          role={failed ? "alert" : "status"}
          className={failed ? "text-sm text-rose-600 dark:text-rose-400" : muted}
        >
          {message || "Lưu để áp dụng hạn mức cho tháng đang chọn."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={button} onClick={resetAll}>Xóa toàn bộ hạn mức</button>
          <button type="submit" disabled={saving} className={primary}>
            {saving ? "Đang lưu…" : "Lưu ngân sách"}
          </button>
        </div>
      </div>
    </form>
  );
}
