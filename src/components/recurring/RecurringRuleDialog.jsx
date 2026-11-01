import { useState } from "react";
import SmartSelect from "../common/SmartSelect";
import useModalDialog from "../common/useModalDialog";
import { useCategories } from "../../context/CategoryContext";
import { formatVndAsThousands, parseThousandsToVnd, sanitizeThousandsInput } from "../../utils/moneyInput";
import { recurringType, validateRecurringRule } from "../../utils/recurringExpenses";
import { button, input, primary } from "../finance/ui";

/** Used only for editing existing recurring rules. Creating new rules uses TransactionModal. */
export default function RecurringRuleDialog({ rule, month, onSave, onClose }) {
  const categories = useCategories();
  const type = recurringType(rule);
  const [draft, setDraft] = useState(() => ({ title: "", category: categories[type].find(c => !c.locked && !c.hidden)?.id || "",
    day: 1, startMonth: month, endMonth: "", note: "", active: true, ...rule, type }));
  const [amountText, setAmountText] = useState(() => rule ? formatVndAsThousands(rule.amount) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialog = useModalDialog(onClose, busy);
  const change = (key, value) => { setDraft(d => ({ ...d, [key]: value })); setError(""); };
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    try {
      const value = validateRecurringRule({ ...draft, amount: parseThousandsToVnd(amountText) }, categories);
      setBusy(true); await onSave(value, rule?.id); onClose();
    } catch (reason) { setError(reason.message || "Không lưu được khoản định kỳ."); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog.ref} onCancel={dialog.onCancel} aria-labelledby="recurring-title" className="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-xl overflow-visible rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/70 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
    <form onSubmit={submit} className="grid max-h-[92dvh] gap-4 overflow-y-auto p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><h2 id="recurring-title" className="text-xl font-extrabold">Sửa khoản {type === "income" ? "thu" : "chi"} định kỳ</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Chỉ thay đổi những kỳ chưa ghi nhận.</p></div><button type="button" className={`${button} !min-h-9 !px-3`} disabled={busy} onClick={onClose}>✕</button></div>
      <fieldset disabled={busy} className="grid gap-3">
        <label className="grid gap-1.5 text-sm font-semibold">Tên khoản định kỳ<input autoFocus required maxLength={100} className={input} placeholder="VD: YouTube Premium, tiền lương" value={draft.title} onChange={e => change("title", e.target.value)}/></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">Số tiền (nghìn đồng)<input required inputMode="decimal" className={input} placeholder="0" value={amountText} onChange={e => setAmountText(sanitizeThousandsInput(e.target.value))}/></label>
          <label className="grid gap-1.5 text-sm font-semibold">Ngày trong tháng<input type="number" min="1" max="31" required className={input} value={draft.day} onChange={e => change("day", Number(e.target.value))}/></label>
        </div>
        <label className="grid gap-1.5 text-sm font-semibold">Danh mục<SmartSelect label="Danh mục khoản định kỳ" value={draft.category} onChange={v => change("category", v)} options={categories[type].filter(c => !c.locked && (!c.hidden || c.id === draft.category)).map(c => ({ value: c.id, label: `${c.icon || ""} ${c.name}` }))}/></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">Bắt đầu từ tháng<input type="month" min="2023-01" max="2091-12" required className={input} value={draft.startMonth} onChange={e => change("startMonth", e.target.value)}/></label>
          <label className="grid gap-1.5 text-sm font-semibold">Dừng sau tháng (tùy chọn)<input type="month" min={draft.startMonth} max="2091-12" className={input} value={draft.endMonth} onChange={e => change("endMonth", e.target.value)}/></label>
        </div>
        <label className="grid gap-1.5 text-sm font-semibold">Ghi chú (tùy chọn)<input className={input} maxLength={500} placeholder="Nội dung khoản định kỳ" value={draft.note} onChange={e => change("note", e.target.value)}/></label>
      </fieldset>
      <p className="text-xs text-slate-500 dark:text-slate-400">Ngày 29–31 được tự điều chỉnh về cuối tháng khi cần. Những giao dịch đã ghi nhận vẫn giữ nguyên khi sửa lịch.</p>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-700"><button type="button" className={button} disabled={busy} onClick={onClose}>Hủy</button><button type="submit" disabled={busy} className={primary}>{busy ? "Đang lưu…" : "Lưu thay đổi"}</button></div>
    </form>
  </dialog>;
}
