import { useMemo, useState } from "react";
import { useCategories } from "../context/CategoryContext";
import BudgetLimitDialog from "../components/budget/BudgetLimitDialog";
import BudgetProgressBar from "../components/budget/BudgetProgressBar";
import { panel, primary, button, muted } from "../components/finance/ui";
import { isActual } from "../utils/finance";
import { formatMoney } from "../utils/money";
import { budgetWithLimit } from "../utils/budgetEdits";
import { useConfirm } from "../components/common/ConfirmProvider";

export default function BudgetPage({ budget, rows, onSave, inherited = false, sourceMonth = null }) {
  const { expense, getCategoryById } = useCategories();
  const confirm = useConfirm();
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showUnconfigured, setShowUnconfigured] = useState(false);

  const limits = budget?.categories || {};
  const total = Number(budget?.total) || 0;
  const actual = useMemo(() => rows.filter((tx) => tx.type === "expense" && isActual(tx)), [rows]);
  const spent = actual.reduce((sum, tx) => sum + tx.amount, 0);
  const expensesByCategory = useMemo(() => {
    const result = {};
    actual.forEach((tx) => { result[tx.category] = (result[tx.category] || 0) + tx.amount; });
    return result;
  }, [actual]);

  // Keep limits for hidden categories visible, so old data can always be edited/cleared.
  const configured = Object.entries(limits)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([id, amount]) => ({ ...getCategoryById(id), id, amount: Number(amount), spent: expensesByCategory[id] || 0 }))
    .sort((a, b) => (b.spent / b.amount) - (a.spent / a.amount) || a.name.localeCompare(b.name, "vi"));
  const canConfigure = expense.filter((cat) => !cat.hidden && !cat.locked);
  const notConfigured = canConfigure.filter((cat) => !(Number(limits[cat.id]) > 0))
    .sort((a, b) => (expensesByCategory[b.id] || 0) - (expensesByCategory[a.id] || 0));
  const left = total - spent;
  const overBudget = total > 0 && spent > total;

  async function commit({ categoryId, amount }) {
    // Validate at the UI boundary. Cloud budgets are still integer VND.
    const next = budgetWithLimit(budget, { categoryId, amount });
    setBusy(true); setError(""); setMessage("");
    try { await onSave(next); setMessage("Đã lưu hạn mức tháng này lên Firebase."); }
    catch (reason) { throw reason; }
    finally { setBusy(false); }
  }

  async function clear(categoryId) {
    if (!await confirm({ title: "Xóa hạn mức danh mục?", message: `Xóa hạn mức “${getCategoryById(categoryId).name}” từ tháng này? Các tháng trước vẫn giữ nguyên.`, confirmLabel: "Xóa hạn mức", destructive: true })) return;
    try { await commit({ categoryId, amount: 0 }); }
    catch (reason) { setError(reason?.message || "Không thể xóa hạn mức."); }
  }

  async function clearAll() {
    if (!await confirm({ title: "Đặt ngân sách về 0?", message: "Đặt tất cả hạn mức về 0 từ tháng này? Các tháng trước và giao dịch không đổi.", confirmLabel: "Xóa hạn mức", destructive: true })) return;
    setBusy(true); setError(""); setMessage("");
    try { await onSave({ total: 0, categories: {} }); setMessage("Đã xóa toàn bộ hạn mức tháng này."); }
    catch (reason) { setError(reason?.message || "Không thể xóa ngân sách."); }
    finally { setBusy(false); }
  }

  return <div className="grid min-w-0 gap-5 sm:gap-6" aria-busy={busy}>
    <section className={panel}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Hạn mức tháng đang chọn</p>
          <p className="mt-1 break-words text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">{total > 0 ? formatMoney(total) : "Chưa đặt ngân sách"}</p>
          <p className={`mt-2 ${muted}`}>Số chi thực tế tự cập nhật từ Thu chi và Sổ mừng. {inherited && sourceMonth ? `Đang kế thừa mức của tháng ${Number(sourceMonth.slice(5))}/${sourceMonth.slice(0, 4)}; chỉnh tại đây sẽ áp dụng từ tháng này về sau.` : "Thay đổi mức sẽ không tác động ngược đến tháng trước."}</p>
        </div>
        <button type="button" className={primary} disabled={busy} onClick={() => setEditor({ mode: "total" })}>
          {total > 0 ? "Sửa ngân sách" : "+ Đặt ngân sách"}
        </button>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-[#f4f8f5] p-4 dark:bg-slate-950/50"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ngân sách</p><p className="mt-2 break-words text-lg font-extrabold tabular-nums">{formatMoney(total)}</p></div>
        <div className="rounded-xl bg-[#f4f8f5] p-4 dark:bg-slate-950/50"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đã chi</p><p className="mt-2 break-words text-lg font-extrabold tabular-nums">{formatMoney(spent)}</p></div>
        <div className="rounded-xl bg-[#f4f8f5] p-4 dark:bg-slate-950/50"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{overBudget ? "Vượt ngân sách" : "Còn có thể chi"}</p>
          <p className={`mt-2 break-words text-lg font-extrabold tabular-nums ${overBudget ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}`}>{total > 0 ? formatMoney(Math.abs(left)) : "—"}</p></div>
      </div>
      <div className="mt-5"><BudgetProgressBar spent={spent} limit={total} title="Tiến độ ngân sách chung" large /></div>
    </section>

    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
    {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">{message}</p>}

    <section className={panel}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-extrabold">Hạn mức theo danh mục</h2>
          <p className={`mt-1 ${muted}`}>Chỉ hiển thị danh mục đã đặt hạn mức. Các hạn mức riêng nằm trong ngân sách chung, không cộng thêm vào tổng.</p></div>
        <button type="button" className={primary} disabled={busy || !notConfigured.length} onClick={() => setEditor({ mode: "category" })}>+ Thêm hạn mức</button>
      </div>
      {configured.length ? <div className="divide-y divide-[#e8eee9] dark:divide-slate-800">
        {configured.map((cat) => <article key={cat.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_minmax(180px,1.2fr)_auto] md:items-center md:gap-5">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-lg dark:bg-emerald-950/40">{cat.icon || "•"}</span>
            <div className="min-w-0"><h3 className="truncate text-sm font-bold" title={cat.name}>{cat.name}</h3>
              <p className="mt-1 text-xs tabular-nums text-slate-500 dark:text-slate-400">{formatMoney(cat.spent)} / {formatMoney(cat.amount)}{cat.hidden ? " · Đã ẩn" : ""}</p></div>
          </div>
          <BudgetProgressBar spent={cat.spent} limit={cat.amount} title={`Tiến độ ${cat.name}`} />
          <div className="flex flex-wrap justify-end gap-2"><button type="button" className={`${button} !min-h-9 !px-3`} disabled={busy} onClick={() => setEditor({ mode: "category", categoryId: cat.id })}>Sửa</button>
            <button type="button" className={`${button} !min-h-9 !px-3`} disabled={busy} onClick={() => clear(cat.id)}>Xóa hạn mức</button></div>
        </article>)}
      </div> : <div className="rounded-2xl border border-dashed border-[#cbded0] bg-[#f9fcfa] px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-950/30">
        <p className="font-semibold">Chưa có hạn mức riêng cho danh mục</p><p className={`mt-2 ${muted}`}>Bạn có thể chỉ đặt ngân sách chung, hoặc bổ sung hạn mức cho những khoản chi cần kiểm soát.</p>
        <button type="button" className={`${button} mt-4`} disabled={busy || !notConfigured.length} onClick={() => setEditor({ mode: "category" })}>+ Đặt hạn mức đầu tiên</button>
      </div>}
    </section>

    {!!notConfigured.length && <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-bold">Danh mục chưa đặt hạn mức</h2><p className={`mt-1 ${muted}`}>Ưu tiên danh mục đang chi nhiều nhất trong tháng.</p></div>
        <button type="button" className={button} aria-expanded={showUnconfigured} onClick={() => setShowUnconfigured((value) => !value)}>{showUnconfigured ? "Thu gọn" : `Xem ${notConfigured.length} danh mục`}</button>
      </div>
      {showUnconfigured && <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {notConfigured.map((cat) => <div key={cat.id} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-[#e2ece5] px-3 py-2.5 dark:border-slate-800">
          <span className="min-w-0 truncate text-sm font-semibold" title={cat.name}>{cat.icon || "•"} {cat.name}<span className="ml-2 text-xs font-normal text-slate-500">{formatMoney(expensesByCategory[cat.id] || 0)}</span></span>
          <button type="button" disabled={busy} className="shrink-0 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400" onClick={() => setEditor({ mode: "category", categoryId: cat.id })}>Đặt hạn mức</button>
        </div>)}
      </div>}
    </section>}

    {(total > 0 || configured.length > 0) && <div className="flex justify-end"><button type="button" disabled={busy} className="text-sm font-semibold text-rose-600 underline-offset-4 hover:underline dark:text-rose-400" onClick={clearAll}>Xóa toàn bộ hạn mức tháng này</button></div>}

    {editor && <BudgetLimitDialog
      key={`${editor.mode}:${editor.categoryId || "new"}`}
      mode={editor.mode}
      categoryId={editor.categoryId}
      categories={editor.mode === "total" ? [] : editor.categoryId ? [getCategoryById(editor.categoryId)] : notConfigured}
      budget={budget} onSave={commit} onClose={() => setEditor(null)} />}
  </div>;
}
