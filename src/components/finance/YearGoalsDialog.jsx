import { useEffect, useState } from "react";
import useModalDialog from "../common/useModalDialog";
import SmartSelect from "../common/SmartSelect";
import { button, input, primary, muted } from "./ui";
import { formatVndAsThousands, parseThousandsToVnd, sanitizeThousandsInput } from "../../utils/moneyInput";

const months = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Tháng ${i + 1}` }));
const toText = (n) => n == null ? "" : formatVndAsThousands(n);
const parseGoal = (s) => s.trim() === "" ? null : parseThousandsToVnd(s, { allowZero: true });

export default function YearGoalsDialog({ year, rows, initialMonth, onSave, onClose }) {
  const [scope, setScope] = useState("month");
  const [month, setMonth] = useState(initialMonth);
  const chosen = rows[month - 1];
  const [income, setIncome] = useState(toText(chosen.target));
  const [savingsTarget, setSavingsTarget] = useState(toText(chosen.savingsTarget));
  const [saved, setSaved] = useState(toText(chosen.savings));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const modal = useModalDialog(onClose, busy);

  useEffect(() => {
    if (scope !== "month") return;
    const row = rows[month - 1];
    setIncome(toText(row.target));
    setSavingsTarget(toText(row.savingsTarget));
    setSaved(toText(row.savings));
    setError("");
  }, [month, scope, rows]);

  async function submit(e) {
    e.preventDefault();
    const target = parseGoal(income);
    const savingGoal = parseGoal(savingsTarget);
    const actual = scope === "month" ? (parseGoal(saved) ?? 0) : null;
    const valid = (n) => n === null || (Number.isSafeInteger(n) && n >= 0);
    if (![target, savingGoal, actual].every(valid)) {
      setError("Vui lòng nhập số tiền hợp lệ theo nghìn đồng.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave({ scope, month, target, savingsTarget: savingGoal, recordedSavings: actual });
      onClose();
    } catch (reason) {
      setError(reason?.message || "Không thể lưu mục tiêu.");
    } finally { setBusy(false); }
  }

  return (
    <dialog ref={modal.ref} onCancel={modal.onCancel} aria-labelledby="year-goals-title"
      className="fixed inset-0 m-auto max-h-[min(90dvh,760px)] w-[calc(100%-1.5rem)] max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/65 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <form onSubmit={submit} className="flex max-h-[min(90dvh,760px)] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div><h2 id="year-goals-title" className="text-lg font-extrabold">Thiết lập mục tiêu {year}</h2><p className={`mt-1 ${muted}`}>Mục tiêu không tự cộng vào thu chi thực tế.</p></div>
          <button type="button" aria-label="Đóng" className={`${button} !size-9 !min-h-9 !p-0`} disabled={busy} onClick={onClose}>×</button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <fieldset className="grid grid-cols-2 gap-2" disabled={busy}>
            <legend className="mb-2 text-sm font-semibold">Phạm vi áp dụng</legend>
            {[{ value: "month", label: "Một tháng" }, { value: "all", label: "Cả 12 tháng" }].map((option) => (
              <label key={option.value} className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-bold ${scope === option.value ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-slate-300 dark:border-slate-700"}`}>
                <input className="sr-only" type="radio" name="scope" value={option.value} checked={scope === option.value} onChange={() => setScope(option.value)} />{option.label}
              </label>
            ))}
          </fieldset>
          {scope === "month" && <label className="block space-y-2 text-sm font-semibold">Tháng áp dụng
            <SmartSelect label="Tháng áp dụng" value={String(month)} options={months} onChange={(value) => setMonth(Number(value))} />
          </label>}
          {scope === "all" && <p className="rounded-xl bg-amber-50 p-3 text-xs font-medium leading-5 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Cập nhật mục tiêu cho toàn bộ 12 tháng năm {year}; số tiền tiết kiệm đã ghi nhận ở từng tháng được giữ nguyên.</p>}
          <label className="block space-y-2 text-sm font-semibold">Mục tiêu thu nhập <span className="font-normal text-slate-500">(nghìn đồng)</span>
            <input className={input} type="text" inputMode="decimal" value={income} onChange={(e) => setIncome(sanitizeThousandsInput(e.target.value))} placeholder="0" />
          </label>
          <label className="block space-y-2 text-sm font-semibold">Mục tiêu tiết kiệm <span className="font-normal text-slate-500">(nghìn đồng)</span>
            <input className={input} type="text" inputMode="decimal" value={savingsTarget} onChange={(e) => setSavingsTarget(sanitizeThousandsInput(e.target.value))} placeholder="0" />
          </label>
          {scope === "month" && <label className="block space-y-2 text-sm font-semibold">Đã tiết kiệm thực tế <span className="font-normal text-slate-500">(nghìn đồng)</span>
            <input className={input} type="text" inputMode="decimal" value={saved} onChange={(e) => setSaved(sanitizeThousandsInput(e.target.value))} placeholder="0" />
          </label>}
          {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <button type="button" className={button} disabled={busy} onClick={onClose}>Hủy</button>
          <button type="submit" className={primary} disabled={busy}>{busy ? "Đang lưu…" : scope === "all" ? "Lưu cho 12 tháng" : `Lưu tháng ${month}`}</button>
        </div>
      </form>
    </dialog>
  );
}
