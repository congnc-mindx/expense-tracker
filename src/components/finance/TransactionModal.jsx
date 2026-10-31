import { useRef, useState } from "react";
import SmartSelect from "../common/SmartSelect";
import useModalDialog from "../common/useModalDialog";
import { useCategories } from "../../context/CategoryContext";
import DatePicker from "../common/DatePicker";
import { localDate } from "../../utils/finance";
import { parseMoneyInput, formatMoney } from "../../utils/money.js";
import { input, button, primary, muted } from "./ui";

export default function TransactionModal({
  transaction,
  defaultType,
  onSave,
  onClose,
}) {
  const lock = useRef(false);
  const { expense: EXPENSE_CATEGORIES, income: INCOME_CATEGORIES, groups: EXPENSE_GROUPS } = useCategories();
  const [draft, setDraft] = useState(() => ({
    type: defaultType,
    amount: "",
    category: defaultType === "income" ? (INCOME_CATEGORIES.find(c=>!c.hidden && !c.locked)?.id || "salary") : (EXPENSE_CATEGORIES.find(c=>!c.hidden && !c.locked)?.id || "food"),
    date: localDate(),
    note: "",
    source: "",
    status: "actual",
    ...transaction,
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const modalDialog = useModalDialog(onClose, saving);
  function change(field, value) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setError("");
  }
  function close() {
    if (!lock.current) onClose();
  }
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    setError("");
    try {
      await onSave(
        { ...draft, amount: parseMoneyInput(draft.amount) },
        transaction?.id,
      );
      onClose();
    } catch (reason) {
      setError(reason.message || "Chưa lưu được giao dịch.");
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={modalDialog.ref}
      aria-labelledby="transaction-title"
      onCancel={modalDialog.onCancel}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl backdrop:bg-slate-950/65 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-7"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="transaction-title" className="text-xl font-bold">
          {transaction ? "Sửa giao dịch" : "Thêm giao dịch"}
        </h2>
        <button
          type="button"
          onClick={close}
          disabled={saving}
          className={button}
          aria-label="Đóng form"
        >
          ✕
        </button>
      </div>
      <form onSubmit={submit} className="grid gap-5">
        <fieldset disabled={saving} className="grid gap-5">
          <div className="grid grid-cols-2 gap-2">
            {[
              ["expense", "Khoản chi"],
              ["income", "Khoản thu"],
            ].map(([type, label]) => (
              <button
                type="button"
                key={type}
                aria-pressed={draft.type === type}
                className={draft.type === type ? primary : button}
                onClick={() =>
                  setDraft((previous) => ({
                    ...previous,
                    type,
                    category: (type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).find((c)=>!c.hidden && !c.locked)?.id || "",
                  }))
                }
              >
                {label}
              </button>
            ))}
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Số tiền (đồng)
            <input
              autoFocus
              inputMode="numeric"
              required
              value={
                draft.amount ? Number(draft.amount).toLocaleString("vi-VN") : ""
              }
              onChange={(e) =>
                change("amount", parseMoneyInput(e.target.value))
              }
              placeholder="0"
              className={`${input} py-4 text-3xl font-bold`}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {[35000, 50000, 100000, 200000, 500000].map((amount) => (
              <button
                key={amount}
                type="button"
                className={button}
                onClick={() => change("amount", amount)}
              >
                {formatMoney(amount)}
              </button>
            ))}
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Danh mục
            <SmartSelect label="Danh mục" value={draft.category} onChange={(v) => change("category", v)}
              options={draft.type === "expense" ? EXPENSE_GROUPS.map((group) => ({label: group.name, options: EXPENSE_CATEGORIES.filter((cat) => cat.groupId === group.id && !cat.locked && (!cat.hidden || cat.id === draft.category)).map((cat) => ({value: cat.id, label: cat.name}))})) : INCOME_CATEGORIES.filter((cat)=>!cat.locked && (!cat.hidden || cat.id === draft.category)).map((cat) => ({value: cat.id, label: cat.name}))} />
          </label>
          {draft.type === "income" && (
            <label className="grid gap-2 text-sm font-semibold">
              Nguồn thu
              <input
                value={draft.source}
                onChange={(e) => change("source", e.target.value)}
                placeholder="VD: MindX, YouTube, dạy riêng…"
                maxLength={100}
                className={input}
              />
            </label>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Ngày giao dịch
              <DatePicker label="Ngày giao dịch" value={draft.date} onChange={(date)=>change("date",date)} disabled={saving}/>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Trạng thái
              <SmartSelect label="Trạng thái" value={draft.status} onChange={(v) => change("status", v)} options={[{value:"actual", label:draft.type === "income" ? "Đã nhận" : "Đã chi"},{value:"planned",label:"Dự kiến"}]}/>
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Ghi chú
            <input
              value={draft.note}
              onChange={(e) => change("note", e.target.value)}
              placeholder="Nội dung giao dịch"
              maxLength={500}
              className={input}
            />
          </label>
          <p className={muted}>
            Khoản dự kiến và giao dịch mang ngày tương lai chưa được cộng vào
            thực thu, thực chi.
          </p>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={button}
            disabled={saving}
            onClick={close}
          >
            Hủy
          </button>
          <button type="submit" className={primary} disabled={saving}>
            {saving ? "Đang lưu…" : "Lưu giao dịch"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
