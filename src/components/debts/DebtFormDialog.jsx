import MoneyEquivalent from "../common/MoneyEquivalent";
import { useState } from "react";
import useModalDialog from "../common/useModalDialog";
import DatePicker from "../common/DatePicker";
import { button, input, muted, primary } from "../finance/ui";
import { formatVndAsThousands, sanitizeThousandsInput } from "../../utils/moneyInput";
import { localDate } from "../../utils/finance";
import { validateDebt } from "../../utils/debts";

export default function DebtFormDialog({ debt, initialDirection = "payable", onSave, onClose }) {
  const [direction, setDirection] = useState(debt?.direction || initialDirection);
  const [person, setPerson] = useState(debt?.person || "");
  const [amount, setAmount] = useState(debt ? formatVndAsThousands(debt.amount) : "");
  const [date, setDate] = useState(debt?.date || localDate());
  const [dueDate, setDueDate] = useState(debt?.dueDate || "");
  const [note, setNote] = useState(debt?.note || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const modal = useModalDialog(onClose, saving);
  const hasPayments = Boolean(debt?.payments?.length);

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    try {
      const clean = validateDebt({ direction, person, amount: parsed, date, dueDate, note, payments: debt?.payments || [] });
      setSaving(true); setError("");
      await onSave(clean, debt?.id);
      onClose();
    } catch (reason) {
      setError(reason?.message || "Không thể lưu khoản nợ.");
    } finally { setSaving(false); }
  }

  function handleNoteKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return <dialog ref={modal.ref} onCancel={modal.onCancel} aria-labelledby="debt-form-title"
    className="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/65 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
    <form onSubmit={submit} className="grid gap-4 p-5 sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div><h2 id="debt-form-title" className="text-xl font-extrabold">{debt ? "Sửa khoản nợ" : "Ghi khoản nợ mới"}</h2>
          <p className={`mt-1 ${muted}`}>Theo dõi số còn nợ và những lần thanh toán.</p></div>
        <button type="button" className={`${button} !min-h-9 !px-3`} disabled={saving} onClick={onClose} aria-label="Đóng">✕</button>
      </header>
      <fieldset disabled={saving} className="grid gap-4">
        <div>
          <p className="mb-2 text-sm font-bold">Chiều khoản nợ</p>
          <div className="grid grid-cols-2 gap-2">
            {[{ value: "payable", label: "Tôi đang nợ" }, { value: "receivable", label: "Người khác nợ tôi" }].map((option) => (
              <label key={option.value} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-3 text-center text-sm font-bold transition-colors ${direction === option.value ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 hover:border-emerald-500 dark:border-slate-700 dark:hover:border-emerald-500"} ${hasPayments ? "opacity-70" : ""}`}>
                <input className="sr-only" type="radio" name="debt-direction" checked={direction === option.value} disabled={hasPayments} onChange={() => setDirection(option.value)} />{option.label}
              </label>
            ))}
          </div>
          {hasPayments && <p className={`mt-2 text-xs ${muted}`}>Không đổi chiều nợ sau khi đã có thanh toán.</p>}
        </div>
        <label className="grid gap-1.5 text-sm font-semibold">{direction === "payable" ? "Tôi nợ ai?" : "Ai đang nợ tôi?"}
          <input className={input} autoFocus maxLength={120} required value={person} onChange={(event) => setPerson(event.target.value)} placeholder="VD: Minh Anh" />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          <span className="flex flex-wrap items-baseline gap-x-1.5">Số tiền gốc <span className="text-xs font-normal text-slate-500">(nghìn đồng)</span></span>
          <input className={input} inputMode="decimal" placeholder="0" required value={amount} onChange={(event) => setAmount(sanitizeThousandsInput(event.target.value))} />
          <MoneyEquivalent value={amount} allowZero={false} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5 text-sm font-semibold"><span>Ngày phát sinh</span>
            <DatePicker label="Ngày phát sinh khoản nợ" value={date} onChange={setDate} disabled={saving} />
          </div>
          <div className="grid gap-1.5 text-sm font-semibold"><span className="flex flex-wrap items-baseline gap-x-1.5">Hẹn trả <span className="text-xs font-normal text-slate-500">(tùy chọn)</span></span>
            <div className="flex min-w-0 gap-1.5"><div className="min-w-0 flex-1"><DatePicker label="Ngày hẹn trả" value={dueDate} onChange={setDueDate} disabled={saving} /></div>
              {dueDate && <button className={`${button} !px-3`} type="button" onClick={() => setDueDate("")} aria-label="Bỏ ngày hẹn">×</button>}
            </div>
          </div>
        </div>
        <label className="grid gap-1.5 text-sm font-semibold">
          <span className="flex flex-wrap items-baseline gap-x-1.5">Ghi chú <span className="text-xs font-normal text-slate-500">(tùy chọn)</span></span>
          <textarea className={`${input} min-h-11 resize-none overflow-hidden`} rows={1} maxLength={1200} value={note} onKeyDown={handleNoteKeyDown} onChange={(event) => setNote(event.target.value)} placeholder="VD: Tiền mượn mua đồ, lý do cho vay…" />
        </label>
      </fieldset>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
      <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <button type="button" className={button} disabled={saving} onClick={onClose}>Hủy</button>
        <button type="submit" className={primary} disabled={saving}>{saving ? "Đang lưu…" : debt ? "Lưu thay đổi" : "Tạo khoản nợ"}</button>
      </footer>
    </form>
  </dialog>;
}
