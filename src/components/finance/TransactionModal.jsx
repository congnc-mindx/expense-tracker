import { useRef, useState } from "react";
import SmartSelect from "../common/SmartSelect";
import useModalDialog from "../common/useModalDialog";
import { useCategories } from "../../context/CategoryContext";
import DatePicker from "../common/DatePicker";
import { localDate } from "../../utils/finance";
import { formatMoney } from "../../utils/money.js";
import { formatVndAsThousands, parseThousandsToVnd, sanitizeThousandsInput } from "../../utils/moneyInput.js";
import { input, button, primary } from "./ui";

const SUGGESTED_AMOUNTS = [50, 100, 200, 500];

export default function TransactionModal({ transaction, defaultType, onSave, onClose }) {
  const lock = useRef(false);
  const { expense: expenseCategories, income: incomeCategories, groups } = useCategories();
  const [draft, setDraft] = useState(() => ({
    type: defaultType,
    category: (defaultType === "income" ? incomeCategories : expenseCategories).find((c) => !c.hidden && !c.locked)?.id || "",
    date: localDate(),
    note: "",
    status: "actual",
    source: "",
    ...transaction,
  }));
  const [amountText, setAmountText] = useState(() => transaction ? formatVndAsThousands(transaction.amount) : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const modalDialog = useModalDialog(onClose, saving);
  const amount = parseThousandsToVnd(amountText);

  function change(field, value) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setError("");
  }
  function changeType(type) {
    if (type === draft.type) return;
    const choices = type === "income" ? incomeCategories : expenseCategories;
    setDraft((previous) => ({
      ...previous,
      type,
      category: choices.find((item) => !item.hidden && !item.locked)?.id || "",
    }));
    setError("");
  }
  function close() {
    if (!lock.current) onClose();
  }
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("Hãy nhập số tiền hợp lệ theo nghìn đồng. VD: 355 = 355.000 đ.");
      return;
    }
    lock.current = true;
    setSaving(true);
    setError("");
    try {
      // Persist exact VND; do not multiply again when editing an existing entry.
      // New entries are actual; old planned entries keep their history until edited.
      await onSave({ ...draft, amount, status: "actual" }, transaction?.id);
      onClose();
    } catch (reason) {
      setError(reason.message || "Chưa lưu được giao dịch.");
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }

  const categoryOptions = draft.type === "expense"
    ? groups.map((group) => ({
      label: group.name,
      options: expenseCategories
        .filter((cat) => cat.groupId === group.id && !cat.locked && (!cat.hidden || cat.id === draft.category))
        .map((cat) => ({ value: cat.id, label: `${cat.icon || ""} ${cat.name}`.trim() })),
    })).filter((group) => group.options.length)
    : incomeCategories
      .filter((cat) => !cat.locked && (!cat.hidden || cat.id === draft.category))
      .map((cat) => ({ value: cat.id, label: cat.name }));

  return (
    <dialog
      ref={modalDialog.ref}
      aria-labelledby="transaction-title"
      onCancel={modalDialog.onCancel}
      className="fixed inset-0 m-auto max-h-[94dvh] w-[calc(100%-1.5rem)] max-w-[610px] overflow-visible rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/65 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      {/* Keep dialog overflow visible for anchored selectors; only its contents scroll on short screens. */}
      <div className="max-h-[94dvh] overflow-y-auto overscroll-contain rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="transaction-title" className="text-xl font-extrabold tracking-tight">
            {transaction ? "Sửa giao dịch" : "Thêm giao dịch"}
          </h2>
          <button type="button" onClick={close} disabled={saving} aria-label="Đóng form"
            className={`${button} !size-9 !min-h-9 shrink-0 !p-0`}>×</button>
        </div>
        <form onSubmit={submit} className="grid gap-4">
          <fieldset disabled={saving} className="grid min-w-0 gap-4">
            <div className="grid grid-cols-2 gap-2">
              {[["expense", "Khoản chi"], ["income", "Khoản thu"]].map(([type, label]) => (
                <button type="button" key={type} aria-pressed={draft.type === type}
                  className={`${draft.type === type ? primary : button} !min-h-10 !py-2`}
                  onClick={() => changeType(type)}>{label}</button>
              ))}
            </div>

            <label className="grid gap-1.5 text-sm font-semibold">
              <span className="flex flex-wrap items-baseline gap-x-1.5">Số tiền <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(nghìn đồng)</span></span>
              <input
                autoFocus
                inputMode="decimal"
                required
                value={amountText}
                onChange={(event) => { setAmountText(sanitizeThousandsInput(event.target.value)); setError(""); }}
                placeholder="0"
                className={`${input} !min-h-12 !py-2 !text-base font-medium tabular-nums placeholder:font-normal placeholder:text-slate-400`}
              />
            </label>
            <div className="flex flex-wrap gap-1.5" aria-label="Số tiền gợi ý">
              {SUGGESTED_AMOUNTS.map((thousands) => <button type="button" key={thousands}
                className={`${button} !min-h-8 !rounded-lg !px-2.5 !py-1 !text-xs`}
                onClick={() => { setAmountText(String(thousands)); setError(""); }}>
                {formatMoney(thousands * 1000)}
              </button>)}
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
                Danh mục
                <SmartSelect label="Danh mục" value={draft.category} onChange={(v) => change("category", v)} options={categoryOptions} />
              </label>
              <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
                Ngày giao dịch
                <DatePicker label="Ngày giao dịch" value={draft.date} onChange={(v) => change("date", v)} disabled={saving} />
              </label>
            </div>

            <label className="grid gap-1.5 text-sm font-semibold">
              <span className="flex flex-wrap items-baseline gap-x-1.5">Ghi chú <span className="text-xs font-normal text-slate-400">(tùy chọn)</span></span>
              <input value={draft.note} onChange={(e) => change("note", e.target.value)}
                placeholder="Nội dung giao dịch, nguồn thu…" maxLength={500} className={`${input} placeholder:font-normal placeholder:text-slate-400`} />
            </label>
            {draft.date > localDate() && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                Ngày tương lai: khoản này chưa được cộng vào thực thu, thực chi cho đến ngày giao dịch.
              </p>
            )}
          </fieldset>

          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <button type="button" className={`${button} !min-h-10`} disabled={saving} onClick={close}>Hủy</button>
            <button type="submit" className={`${primary} !min-h-10`} disabled={saving}>{saving ? "Đang lưu…" : "Lưu giao dịch"}</button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
