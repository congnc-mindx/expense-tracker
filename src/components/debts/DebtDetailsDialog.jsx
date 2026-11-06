import { useState } from "react";
import useModalDialog from "../common/useModalDialog";
import DatePicker from "../common/DatePicker";
import { button, input, muted, primary } from "../finance/ui";
import { formatMoney } from "../../utils/money";
import { formatVndAsThousands, parseThousandsToVnd, sanitizeThousandsInput } from "../../utils/moneyInput";
import { debtPayments, debtStatus, outstandingDebtAmount, paidDebtAmount } from "../../utils/debts";
import { localDate } from "../../utils/finance";
import { useConfirm } from "../common/ConfirmProvider";
import useIncrementalList from "../common/useIncrementalList";
import LoadMoreButton from "../common/LoadMoreButton";

const formatDate = (value) => value ? value.split("-").reverse().join("/") : "—";

export default function DebtDetailsDialog({ debt, onClose, onEdit, onDelete, onPayment, onRemovePayment }) {
  const confirm = useConfirm();
  const [amountText, setAmountText] = useState("");
  const [date, setDate] = useState(localDate());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const modal = useModalDialog(onClose, busy);
  const rest = outstandingDebtAmount(debt);
  const paid = paidDebtAmount(debt);
  const payments = debtPayments(debt).slice().sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
  const paging = useIncrementalList(payments, [debt.id], 10);
  const parsed = parseThousandsToVnd(amountText);
  const isReceivable = debt.direction === "receivable";
  const status = debtStatus(debt);

  async function submit(event, full = false) {
    event?.preventDefault();
    if (busy || rest <= 0) return;
    const amount = full ? rest : parsed;
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > rest) {
      setError("Nhập số tiền hợp lệ và không vượt số còn nợ."); return;
    }
    if (date < debt.date) { setError("Ngày thanh toán không được trước ngày ghi nợ."); return; }
    setBusy(true); setError("");
    try {
      await onPayment(debt.id, { amount, date, note: full ? "Tất toán" : note });
      setAmountText(""); setNote("");
    } catch (reason) { setError(reason?.message || "Chưa ghi nhận được khoản trả."); }
    finally { setBusy(false); }
  }

  async function removePayment(payment) {
    const accepted = await confirm({ title: "Xóa lần thanh toán?", message: `Khoản ${formatMoney(payment.amount)} sẽ được cộng lại vào số còn nợ.`, confirmLabel: "Xóa thanh toán", destructive: true });
    if (!accepted) return;
    setBusy(true); setError("");
    try { await onRemovePayment(debt.id, payment.id); }
    catch (reason) { setError(reason?.message || "Chưa xóa được thanh toán."); }
    finally { setBusy(false); }
  }

  async function removeDebt() {
    const accepted = await confirm({ title: "Xóa khoản nợ?", message: "Xóa luôn lịch sử thanh toán của khoản này. Không thể hoàn tác.", confirmLabel: "Xóa khoản nợ", destructive: true });
    if (!accepted) return;
    setBusy(true); setError("");
    try { await onDelete(debt.id); onClose(); }
    catch (reason) { setError(reason?.message || "Chưa xóa được khoản nợ."); setBusy(false); }
  }

  return <dialog ref={modal.ref} onCancel={modal.onCancel} aria-labelledby="debt-details-title"
    className="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/65 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
    <div className="flex max-h-[92dvh] flex-col">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
        <div className="min-w-0"><p className={`text-xs font-bold ${isReceivable ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>{isReceivable ? "Người khác nợ tôi" : "Tôi đang nợ"}</p>
          <h2 id="debt-details-title" className="mt-1 break-words text-xl font-extrabold">{debt.person}</h2>
          <p className={`mt-1 text-xs ${muted}`}>Ghi ngày {formatDate(debt.date)} · {debt.dueDate ? `Hẹn trả ${formatDate(debt.dueDate)}` : "Chưa đặt hạn trả"}</p>
        </div>
        <button type="button" aria-label="Đóng" className={`${button} !min-h-9 !px-3`} disabled={busy} onClick={onClose}>✕</button>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { title: "Số nợ ban đầu", amount: debt.amount, color: "" },
            { title: isReceivable ? "Đã thu hồi" : "Đã trả", amount: paid, color: "text-emerald-700 dark:text-emerald-400" },
            { title: "Còn lại", amount: rest, color: rest ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400" },
          ].map((item) => <div key={item.title} className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.title}</p><p className={`mt-1 break-words text-base font-extrabold tabular-nums ${item.color}`}>{formatMoney(item.amount)}</p></div>)}
        </div>
        {debt.note && <p className="rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">{debt.note}</p>}
        {status === "paid" && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">✓ Đã tất toán đầy đủ</p>}
        {rest > 0 && <form className="grid gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700" onSubmit={(event) => submit(event)}>
          <h3 className="text-sm font-extrabold">{isReceivable ? "Ghi nhận tiền đã thu" : "Ghi nhận tiền đã trả"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold">Số tiền <span className="text-xs font-normal text-slate-500">(nghìn đồng)</span>
              <input className={input} inputMode="decimal" placeholder="0" disabled={busy} value={amountText} onChange={(event) => setAmountText(sanitizeThousandsInput(event.target.value))} />
              <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">{Number.isSafeInteger(parsed) ? formatMoney(parsed) : "Nhập số tiền đã thanh toán"}</span>
            </label>
            <div className="grid gap-1.5 text-sm font-semibold"><span>Ngày thanh toán</span><DatePicker label="Ngày thanh toán" value={date} onChange={setDate} disabled={busy} /></div>
          </div>
          <label className="grid gap-1.5 text-sm font-semibold">Ghi chú <span className="text-xs font-normal text-slate-500">(tùy chọn)</span>
            <input className={input} maxLength={500} value={note} disabled={busy} onChange={(event) => setNote(event.target.value)} placeholder="VD: Chuyển khoản lần 1" />
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className={button} disabled={busy} onClick={() => { setAmountText(formatVndAsThousands(rest)); }}>Điền số còn lại</button>
            <button type="button" className={button} disabled={busy} onClick={() => submit(null, true)}>Tất toán</button>
            <button type="submit" className={primary} disabled={busy}>{busy ? "Đang lưu…" : "Lưu thanh toán"}</button>
          </div>
        </form>}
        <div>
          <h3 className="mb-2 text-sm font-extrabold">Lịch sử thanh toán · {payments.length}</h3>
          {payments.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {paging.visible.map((payment) => <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0"><p className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{formatMoney(payment.amount)}</p>
                <p className={`mt-1 break-words text-xs ${muted}`}>{formatDate(payment.date)}{payment.note ? ` · ${payment.note}` : ""}</p></div>
              <button type="button" className={`${button} !min-h-9 !px-3 !text-xs`} disabled={busy} onClick={() => removePayment(payment)} aria-label={`Xóa thanh toán ${formatMoney(payment.amount)} ngày ${formatDate(payment.date)}`}>Xóa</button>
            </div>)}
            <LoadMoreButton remaining={paging.remaining} batch={10} onClick={paging.loadMore} noun="lần trả" />
          </div> : <p className={`rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/50 ${muted}`}>Chưa có lần thanh toán nào.</p>}
        </div>
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
      </div>
      <footer className="flex flex-wrap justify-between gap-3 border-t border-slate-100 px-5 py-3.5 dark:border-slate-800 sm:px-6">
        <button type="button" className={`${button} border-rose-300 text-rose-600 dark:text-rose-400`} disabled={busy} onClick={removeDebt}>Xóa khoản nợ</button>
        <div className="flex gap-2"><button type="button" className={button} disabled={busy} onClick={onClose}>Đóng</button>
          <button type="button" className={primary} disabled={busy} onClick={onEdit}>Sửa khoản nợ</button></div>
      </footer>
    </div>
  </dialog>;
}
