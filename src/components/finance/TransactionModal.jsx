import { useEffect, useMemo, useRef, useState } from "react";
import useModalDialog from "../common/useModalDialog";
import SmartSelect from "../common/SmartSelect";
import { useCategories } from "../../context/CategoryContext";
import DatePicker from "../common/DatePicker";
import { localDate } from "../../utils/finance";
import { formatMoney } from "../../utils/money.js";
import { formatVndAsThousands, parseThousandsToVnd, sanitizeThousandsInput } from "../../utils/moneyInput.js";
import { input, button, primary } from "./ui";

const SUGGESTED_AMOUNTS = [50, 100, 200, 500];

function CategoryButton({ active, onClick, children }) {
  return <button type="button" onClick={onClick}
    className={`min-h-10 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${active ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-500 dark:hover:bg-slate-800"}`}>{children}</button>;
}

function ExpenseCategoryPicker({ groups, categories, value, onChange }) {
  const availableGroups = useMemo(() => groups.map((group) => ({
    ...group,
    items: categories.filter((cat) => cat.groupId === group.id && !cat.locked && (!cat.hidden || cat.id === value)),
  })).filter((group) => group.items.length), [groups, categories, value]);
  const selectedGroupId = availableGroups.find((group) => group.items.some((item) => item.id === value))?.id || availableGroups[0]?.id || "";
  const [openGroupId, setOpenGroupId] = useState(selectedGroupId);
  useEffect(() => { setOpenGroupId(selectedGroupId); }, [selectedGroupId]);
  const activeGroup = availableGroups.find((group) => group.id === openGroupId) || availableGroups[0];

  if (!availableGroups.length) return <p className="rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">Chưa có danh mục chi khả dụng.</p>;
  return <div className="grid gap-2.5">
    <div className="flex flex-wrap gap-2">
      {availableGroups.map((group) => <CategoryButton key={group.id} active={openGroupId === group.id} onClick={() => setOpenGroupId(group.id)}>{group.name}</CategoryButton>)}
    </div>
    {activeGroup && <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{activeGroup.name}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {activeGroup.items.map((cat) => <CategoryButton key={cat.id} active={value === cat.id} onClick={() => onChange(cat.id)}>{`${cat.icon || ""} ${cat.name}`.trim()}</CategoryButton>)}
      </div>
    </div>}
  </div>;
}

function IncomeCategoryPicker({ categories, value, onChange }) {
  const options = categories
    .filter((cat) => !cat.locked && (!cat.hidden || cat.id === value))
    .map((cat) => ({ value: cat.id, label: cat.name }));
  return <SmartSelect label="Danh mục" value={value} onChange={onChange} options={options} />;
}

export default function TransactionModal({ transaction, defaultType, onSave, onSaveRecurring, recurringDefault = false, onClose }) {
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
  const [repeatMonthly, setRepeatMonthly] = useState(() => !transaction && recurringDefault);
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
      if (repeatMonthly && !transaction) {
        if (!onSaveRecurring) throw new Error("Chưa sẵn sàng tạo lịch định kỳ.");
        const category = (draft.type === "income" ? incomeCategories : expenseCategories)
          .find((item) => item.id === draft.category);
        await onSaveRecurring({ type: draft.type, category: draft.category, amount,
          title: draft.note.trim().slice(0, 100) || category?.name || "Khoản định kỳ",
          note: draft.note, day: Number(draft.date.slice(8, 10)), startMonth: draft.date.slice(0, 7),
          endMonth: "", active: true });
      } else {
        await onSave({ ...draft, amount, status: "actual" }, transaction?.id);
      }
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
      className="fixed inset-0 m-auto max-h-[94dvh] w-[calc(100%-1.5rem)] max-w-[610px] overflow-visible rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/65 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
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
              {[ ["expense", "Khoản chi"], ["income", "Khoản thu"] ].map(([type, label]) => (
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
                {draft.type === "expense"
                  ? <ExpenseCategoryPicker groups={groups} categories={expenseCategories} value={draft.category} onChange={(v) => change("category", v)} />
                  : <IncomeCategoryPicker categories={incomeCategories} value={draft.category} onChange={(v) => change("category", v)} />}
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
            {!transaction && <div className="rounded-xl border border-[#dce9df] bg-[#f7fbf8] px-3.5 py-3 dark:border-slate-700 dark:bg-slate-800/50">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
                <input type="checkbox" checked={repeatMonthly} onChange={(event) => setRepeatMonthly(event.target.checked)}
                  className="size-4 shrink-0 accent-emerald-600" />
                <span>Lặp lại hằng tháng</span>
              </label>
              {repeatMonthly && <p className="mt-1.5 pl-7 text-xs leading-5 text-slate-600 dark:text-slate-300">
                Bắt đầu từ {draft.date.split("-").reverse().join("/")}, sau đó lặp cùng ngày mỗi tháng.
                Chỉ tạo khoản dự kiến; hãy ghi đã {draft.type === "income" ? "nhận" : "chi"} khi đến hạn.
                Có thể sửa hoặc dừng tại tab Định kỳ.
              </p>}
            </div>}
            {!repeatMonthly && draft.date > localDate() && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                Dự kiến: khoản này chưa được cộng vào thực thu, thực chi cho đến ngày giao dịch.
              </p>
            )}
          </fieldset>

          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <button type="button" className={`${button} !min-h-10`} disabled={saving} onClick={close}>Hủy</button>
            <button type="submit" className={`${primary} !min-h-10`} disabled={saving}>{saving ? "Đang lưu…" : repeatMonthly ? "Lưu lịch định kỳ" : "Lưu giao dịch"}</button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
