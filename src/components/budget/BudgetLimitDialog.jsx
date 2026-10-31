import { useState } from "react";
import SmartSelect from "../common/SmartSelect";
import useModalDialog from "../common/useModalDialog";
import { input, button, primary } from "../finance/ui";
import { formatMoney } from "../../utils/money";
import { formatVndAsThousands, parseThousandsToVnd, sanitizeThousandsInput } from "../../utils/moneyInput";

export default function BudgetLimitDialog({ mode, categories, budget, categoryId: initialId, onSave, onClose }) {
  const isTotal = mode === "total";
  const [categoryId, setCategoryId] = useState(initialId || categories[0]?.id || "");
  const original = isTotal ? budget.total : budget.categories?.[categoryId];
  const [amountText, setAmountText] = useState(() => original ? formatVndAsThousands(original) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const modal = useModalDialog(onClose, saving);
  const amount = amountText.trim() ? parseThousandsToVnd(amountText, { allowZero: true }) : 0;
  const valid = Number.isSafeInteger(amount) && amount >= 0;

  function selectCategory(id) {
    setCategoryId(id);
    setAmountText(budget.categories?.[id] ? formatVndAsThousands(budget.categories[id]) : "");
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!valid || (!isTotal && !categoryId)) { setError("Hãy nhập hạn mức hợp lệ và chọn danh mục."); return; }
    setSaving(true); setError("");
    try { await onSave({ categoryId: isTotal ? null : categoryId, amount }); onClose(); }
    catch (reason) { setError(reason?.message || "Không lưu được hạn mức. Hãy thử lại."); }
    finally { setSaving(false); }
  }
  return <dialog ref={modal.ref} onCancel={modal.onCancel} aria-labelledby="budget-editor-title"
    className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg overflow-visible rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-6">
    <div className="mb-5 flex items-start justify-between gap-3">
      <div><h2 id="budget-editor-title" className="text-xl font-extrabold">{isTotal ? "Ngân sách tháng" : initialId ? "Sửa hạn mức" : "Đặt hạn mức danh mục"}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Áp dụng cho tháng đang chọn, không phát sinh giao dịch chi tiêu.</p></div>
      <button type="button" aria-label="Đóng" className={`${button} !min-h-9 !px-3`} disabled={saving} onClick={onClose}>✕</button>
    </div>
    <form onSubmit={submit} className="grid gap-4">
      <fieldset disabled={saving} className="grid gap-4">
        {!isTotal && <div className="grid gap-2"><label className="text-sm font-semibold">Danh mục</label>
          <SmartSelect label="Chọn danh mục hạn mức" value={categoryId} onChange={selectCategory}
            options={categories.map((cat) => ({ value: cat.id, label: `${cat.icon || "•"} ${cat.name}` }))}/>
        </div>}
        <label className="grid gap-2 text-sm font-semibold">Hạn mức (nghìn đồng)
          <input autoFocus inputMode="decimal" value={amountText} onChange={(e) => { setAmountText(sanitizeThousandsInput(e.target.value)); setError(""); }}
            placeholder="0" className={`${input} !text-lg font-semibold tabular-nums`} />
        </label>
        <p aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">{valid ? `Tương đương ${formatMoney(amount)}` : "Số tiền không hợp lệ."} Nhập 0 để xóa hạn mức.</p>
      </fieldset>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <button type="button" className={button} disabled={saving} onClick={onClose}>Hủy</button>
        <button type="submit" className={primary} disabled={saving || !valid || (!isTotal && !categoryId)}>{saving ? "Đang lưu…" : "Lưu hạn mức"}</button>
      </div>
    </form>
  </dialog>;
}
