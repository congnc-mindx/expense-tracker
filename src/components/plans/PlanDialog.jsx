import { useState } from "react";
import useModalDialog from "../common/useModalDialog";
import DatePicker from "../common/DatePicker";
import SmartSelect from "../common/SmartSelect";
import MoneyEquivalent from "../common/MoneyEquivalent";
import PlanTaskEditor from "./PlanTaskEditor";
import { input, button, primary, muted } from "../finance/ui";
import { PLAN_CATEGORIES, planFunding, validatePlan } from "../../utils/plans";
import { PLAN_HORIZONS, planHorizon } from "../../utils/planHorizon";
import { parseThousandsToVnd, formatVndAsThousands, sanitizeThousandsInput } from "../../utils/moneyInput";
import { formatMoney } from "../../utils/money";

const newId = () => crypto.randomUUID();
const vndText = (amount) => amount ? formatVndAsThousands(amount) : "";
const amountOf = (text) => text.trim() ? parseThousandsToVnd(text, { allowZero: true }) : 0;
const rowFrom = (task) => ({
  ...task,
  estimatedText: vndText(task.estimatedAmount),
  preparedText: vndText(task.preparedAmount),
});

export default function PlanDialog({ plan, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({
    title: plan?.title || "",
    category: plan?.category || "shopping",
    horizon: plan ? planHorizon(plan) : "short",
    targetDate: plan?.targetDate || "",
    note: plan?.note || "",
    tasks: (plan?.tasks || []).map(rowFrom),
  }));
  const [targetText, setTargetText] = useState(() => plan ? formatVndAsThousands(plan.targetAmount) : "");
  const [preparedText, setPreparedText] = useState(() => plan ? vndText(plan.savedAmount) : "");
  const [newTask, setNewTask] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dialog = useModalDialog(onClose, saving);

  // All amounts remain strings in thousands while editing; convert only at save.
  const targetAmount = parseThousandsToVnd(targetText);
  const savedAmount = amountOf(preparedText);
  const rowAmounts = draft.tasks.map((task) => ({
    id: task.id, title: task.title, done: Boolean(task.done),
    estimatedAmount: amountOf(task.estimatedText), preparedAmount: amountOf(task.preparedText),
  }));
  const amountsValid = Number.isSafeInteger(savedAmount) && rowAmounts.every((task) => Number.isSafeInteger(task.estimatedAmount) && Number.isSafeInteger(task.preparedAmount));
  const funding = amountsValid ? planFunding({ savedAmount, tasks: rowAmounts }) : { prepared: NaN, estimated: NaN };

  function change(field, value) { setDraft((old) => ({ ...old, [field]: value })); setError(""); }
  function updateTask(id, patch) {
    const changes = { ...patch };
    for (const key of ["estimatedText", "preparedText"]) {
      if (key in changes) changes[key] = sanitizeThousandsInput(changes[key]);
    }
    setDraft((old) => ({ ...old, tasks: old.tasks.map((task) => task.id === id ? { ...task, ...changes } : task) }));
    setError("");
  }
  function addTask() {
    const title = newTask.trim();
    if (!title || draft.tasks.length >= 40) return;
    change("tasks", [...draft.tasks, { id: newId(), title, done: false, estimatedText: "", preparedText: "" }]);
    setNewTask("");
  }
  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    try {
      const tasks = newTask.trim() && rowAmounts.length < 40
        ? [...rowAmounts, { id: newId(), title: newTask.trim(), done: false, estimatedAmount: 0, preparedAmount: 0 }]
        : rowAmounts;
      const clean = validatePlan({ ...draft, tasks, targetAmount, savedAmount, status: plan?.status || "active" });
      setSaving(true);
      setError("");
      await onSave(clean, plan?.id);
      onClose();
    } catch (reason) {
      setError(reason?.message || "Chưa lưu được kế hoạch. Vui lòng thử lại.");
    } finally { setSaving(false); }
  }

  return <dialog ref={dialog.ref} onCancel={dialog.onCancel} aria-labelledby="plan-dialog-title"
    className="fixed inset-0 m-auto w-[calc(100%-1.5rem)] max-w-[690px] overflow-visible rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/65 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
    <form onSubmit={submit} className="flex max-h-[92dvh] flex-col overflow-hidden rounded-2xl">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
        <div className="min-w-0">
          <h2 id="plan-dialog-title" className="text-lg font-extrabold sm:text-xl">{plan ? "Chỉnh sửa kế hoạch" : "Tạo kế hoạch mới"}</h2>
          <p className={`mt-0.5 ${muted}`}>Mục tiêu, thời hạn và số tiền cần chuẩn bị</p>
        </div>
        <button type="button" className={`${button} !size-9 !min-h-9 !p-0`} disabled={saving} onClick={onClose} aria-label="Đóng">×</button>
      </header>

      <fieldset disabled={saving} className="grid min-h-0 flex-1 gap-4 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">Tên kế hoạch
          <input className={input} required maxLength={120} autoFocus value={draft.title}
            onChange={(event) => change("title", event.target.value)} placeholder="VD: Chuẩn bị đám cưới" />
        </label>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <div className="grid min-w-0 gap-1.5">
            <span className="text-sm font-semibold">Nhóm kế hoạch</span>
            <SmartSelect label="Nhóm kế hoạch" value={draft.category} onChange={(value) => change("category", value)}
              options={PLAN_CATEGORIES.map((item) => ({ value: item.value, label: item.label }))} />
          </div>
          <div className="grid min-w-0 gap-1.5">
            <span className="text-sm font-semibold">Loại kế hoạch</span>
            <div role="group" aria-label="Chọn loại kế hoạch" className="grid grid-cols-2 gap-2">
              {PLAN_HORIZONS.map(({ value, label }) => <button key={value} type="button" aria-pressed={draft.horizon === value}
                className={`min-h-11 rounded-xl border px-2 text-sm font-semibold transition-colors ${draft.horizon === value
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-300 bg-white hover:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-emerald-500"}`}
                onClick={() => change("horizon", value)}>{label}</button>)}
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="grid min-w-0 gap-1.5 text-sm font-semibold"><span>Số tiền mục tiêu <span className="font-normal text-slate-500 dark:text-slate-400">(nghìn đồng)</span></span>
            <input className={input} required inputMode="decimal" placeholder="0" value={targetText}
              onChange={(event) => setTargetText(sanitizeThousandsInput(event.target.value))} />
            <MoneyEquivalent value={targetText} allowZero={false} />
          </label>
          <label className="grid min-w-0 gap-1.5 text-sm font-semibold"><span>Đã chuẩn bị chung <span className="font-normal text-slate-500 dark:text-slate-400">(nghìn đồng)</span></span>
            <input className={input} inputMode="decimal" placeholder="0" value={preparedText}
              onChange={(event) => setPreparedText(sanitizeThousandsInput(event.target.value))} />
            <MoneyEquivalent value={preparedText} />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm dark:bg-emerald-950/20">
          <span className="font-medium text-slate-600 dark:text-slate-300">Tổng đã chuẩn bị</span>
          <strong className="tabular-nums text-emerald-700 dark:text-emerald-400">{Number.isSafeInteger(funding.prepared) ? formatMoney(funding.prepared) : "Chưa hợp lệ"}</strong>
        </div>

        <div className="grid min-w-0 gap-1.5">
          <span className="text-sm font-semibold">Ngày dự kiến <span className="text-xs font-normal text-slate-500">(tùy chọn)</span></span>
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0 flex-1"><DatePicker label="Ngày dự kiến hoàn thành" value={draft.targetDate} onChange={(value) => change("targetDate", value)} disabled={saving} /></div>
            {draft.targetDate && <button type="button" className={`${button} !px-3`} onClick={() => change("targetDate", "")} aria-label="Bỏ ngày dự kiến">×</button>}
          </div>
        </div>

        <PlanTaskEditor tasks={draft.tasks} newTask={newTask} onNewTaskChange={setNewTask}
          onAddTask={addTask} onChangeTask={updateTask}
          onRemoveTask={(id) => change("tasks", draft.tasks.filter((task) => task.id !== id))}
          funding={Number.isSafeInteger(funding.prepared - savedAmount) ? formatMoney(funding.prepared - savedAmount) : "Chưa hợp lệ"} />

        <label className="grid min-w-0 gap-1.5 text-sm font-semibold"><span>Ghi chú <span className="font-normal text-slate-500 dark:text-slate-400">(tùy chọn)</span></span>
          <textarea className={`${input} min-h-11 resize-y`} rows={1} maxLength={1000} value={draft.note}
            onChange={(event) => change("note", event.target.value)} placeholder="Thông tin cần nhớ…" />
        </label>
      </fieldset>

      {error && <p role="alert" className="mx-5 mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 sm:mx-6">{error}</p>}
      <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-5 py-3.5 dark:border-slate-800 sm:px-6">
        <button type="button" disabled={saving} className={button} onClick={onClose}>Hủy</button>
        <button type="submit" disabled={saving} className={primary}>{saving ? "Đang lưu…" : plan ? "Lưu thay đổi" : "Tạo kế hoạch"}</button>
      </footer>
    </form>
  </dialog>;
}
