import { useState } from "react";
import useModalDialog from "../common/useModalDialog";
import DatePicker from "../common/DatePicker";
import SmartSelect from "../common/SmartSelect";
import { input, button, primary, muted } from "../finance/ui";
import { PLAN_CATEGORIES, planFunding, validatePlan } from "../../utils/plans";
import { parseThousandsToVnd, formatVndAsThousands, sanitizeThousandsInput } from "../../utils/moneyInput";
import { formatMoney } from "../../utils/money";

const newId = () => crypto.randomUUID();
const vndText = (n) => n ? formatVndAsThousands(n) : "";
const amountOf = (value) => value.trim() ? parseThousandsToVnd(value, { allowZero: true }) : 0;
const rowFrom = (task) => ({
  ...task,
  estimatedText: vndText(task.estimatedAmount),
  preparedText: vndText(task.preparedAmount),
});

export default function PlanDialog({ plan, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({
    title: plan?.title || "",
    category: plan?.category || "shopping",
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
  const targetAmount = parseThousandsToVnd(targetText);
  const savedAmount = amountOf(preparedText);
  const rowAmounts = draft.tasks.map((task) => ({
    id: task.id, title: task.title, done: Boolean(task.done),
    estimatedAmount: amountOf(task.estimatedText), preparedAmount: amountOf(task.preparedText),
  }));
  const totalsValid = Number.isSafeInteger(savedAmount) && rowAmounts.every((task) => Number.isSafeInteger(task.estimatedAmount) && Number.isSafeInteger(task.preparedAmount));
  const funding = totalsValid ? planFunding({ savedAmount, tasks: rowAmounts }) : { prepared: NaN, estimated: NaN };

  function change(field, value) { setDraft((old) => ({ ...old, [field]: value })); setError(""); }
  function updateTask(id, patch) { change("tasks", draft.tasks.map((task) => task.id === id ? { ...task, ...patch } : task)); }
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
    className="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-[760px] overflow-y-auto rounded-[24px] border border-[#dce9df] bg-white p-5 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-7">
    <div className="mb-5 flex items-center justify-between gap-3">
      <div><h2 id="plan-dialog-title" className="text-xl font-extrabold">{plan ? "Chỉnh sửa kế hoạch" : "Tạo kế hoạch mới"}</h2>
      <p className={`mt-1 ${muted}`}>Lập chi phí và quỹ chuẩn bị riêng cho từng đầu việc.</p></div>
      <button type="button" className={`${button} !px-3`} disabled={saving} onClick={onClose} aria-label="Đóng">✕</button>
    </div>
    <form onSubmit={submit} className="grid gap-4">
      <fieldset disabled={saving} className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold">Tên kế hoạch
          <input className={input} required maxLength={120} autoFocus value={draft.title} onChange={(e) => change("title", e.target.value)} placeholder="VD: Chuẩn bị đám cưới, mua máy giặt…" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Nhóm kế hoạch
            <SmartSelect label="Nhóm kế hoạch" value={draft.category} onChange={(v) => change("category", v)} options={PLAN_CATEGORIES.map((item) => ({ value: item.value, label: item.label }))} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">Ngày dự kiến hoàn thành <span className="text-xs font-normal text-slate-500">(có thể để trống)</span>
            <div className="flex items-center gap-2"><div className="min-w-0 flex-1"><DatePicker label="Ngày dự kiến hoàn thành" value={draft.targetDate} onChange={(v) => change("targetDate", v)} disabled={saving} /></div>
              {draft.targetDate && <button type="button" className={`${button} !px-3`} onClick={() => change("targetDate", "")} aria-label="Bỏ ngày dự kiến">×</button>}
            </div>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Số tiền mục tiêu <span className="text-xs font-normal text-slate-500">(nghìn đồng)</span>
            <input className={input} required inputMode="decimal" placeholder="0" value={targetText} onChange={(e) => setTargetText(sanitizeThousandsInput(e.target.value))} />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{Number.isSafeInteger(targetAmount) ? formatMoney(targetAmount) : "Nhập số tiền dự kiến cần có"}</span>
          </label>
          <label className="grid gap-2 text-sm font-semibold">Đã chuẩn bị chung <span className="text-xs font-normal text-slate-500">(chưa phân bổ, nghìn đồng)</span>
            <input className={input} inputMode="decimal" placeholder="0" value={preparedText} onChange={(e) => setPreparedText(sanitizeThousandsInput(e.target.value))} />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{Number.isSafeInteger(savedAmount) ? formatMoney(savedAmount) : "Giá trị không hợp lệ"}</span>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold">Ghi chú <span className="text-xs font-normal text-slate-500">(tùy chọn)</span>
          <textarea className={input} rows={2} maxLength={1000} value={draft.note} onChange={(e) => change("note", e.target.value)} placeholder="Lý do, đồ cần mua, ghi chú chi phí…" />
        </label>
        <div className="rounded-2xl border border-[#e1ebe4] p-3 dark:border-slate-700 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold">Đầu việc và tiền cần chuẩn bị</h3><span className="text-xs text-slate-500">{draft.tasks.filter((t) => t.done).length}/{draft.tasks.length} hoàn thành</span></div>
          {draft.tasks.length > 0 && <div className="mb-4 grid gap-3">{draft.tasks.map((task) => <div key={task.id} className="grid min-w-0 gap-2 rounded-xl border border-[#e2ece5] p-3 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={task.done} aria-label={`Hoàn thành ${task.title}`} className="size-4 shrink-0 accent-emerald-600" onChange={(e) => updateTask(task.id, { done: e.target.checked })}/>
              <input aria-label="Tên đầu việc" value={task.title} maxLength={150} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950" onChange={(e) => updateTask(task.id, { title: e.target.value })}/>
              <button type="button" className={`${button} !min-h-9 !px-3`} aria-label={`Xóa đầu việc ${task.title}`} onClick={() => change("tasks", draft.tasks.filter((item) => item.id !== task.id))}>×</button>
            </div>
            <div className="grid grid-cols-2 gap-2 pl-0 sm:pl-6">
              <label className="grid min-w-0 gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Chi phí dự kiến (nghìn đồng)
                <input aria-label={`Chi phí dự kiến ${task.title}`} className={`${input} !min-h-10 !py-2 text-sm`} inputMode="decimal" placeholder="0" value={task.estimatedText} onChange={(e)=>updateTask(task.id,{estimatedText:sanitizeThousandsInput(e.target.value)})}/>
              </label>
              <label className="grid min-w-0 gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Đã chuẩn bị (nghìn đồng)
                <input aria-label={`Đã chuẩn bị ${task.title}`} className={`${input} !min-h-10 !py-2 text-sm`} inputMode="decimal" placeholder="0" value={task.preparedText} onChange={(e)=>updateTask(task.id,{preparedText:sanitizeThousandsInput(e.target.value)})}/>
              </label>
            </div>
          </div>)}</div>}
          <div className="flex gap-2"><input value={newTask} onChange={(e) => setNewTask(e.target.value)} maxLength={150} placeholder="Thêm việc cần làm…" className={`${input} min-w-0 !text-sm`} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTask(); } }} />
            <button type="button" onClick={addTask} disabled={!newTask.trim() || draft.tasks.length >= 40} className={`${button} shrink-0`}>+ Thêm</button>
          </div>
          <div className="mt-4 grid gap-1 rounded-xl bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30">
            <p className="flex justify-between gap-2"><span>Chi phí liệt kê</span><strong>{Number.isSafeInteger(funding.estimated) ? formatMoney(funding.estimated) : "Không hợp lệ"}</strong></p>
            <p className="flex justify-between gap-2"><span>Tổng đã chuẩn bị</span><strong className="text-emerald-700 dark:text-emerald-400">{Number.isSafeInteger(funding.prepared) ? formatMoney(funding.prepared) : "Không hợp lệ"}</strong></p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tổng đã chuẩn bị = quỹ chung + tiền phân bổ từng đầu việc. Khi chuyển quỹ chung vào đầu việc, giảm quỹ chung tương ứng để không tính hai lần.</p>
          </div>
        </div>
      </fieldset>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Tiền chuẩn bị chỉ theo dõi mục tiêu, không tự cộng vào thu nhập hay chi tiêu. Tích hoàn thành đầu việc không tự phát sinh tiền.</p>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700"><button type="button" disabled={saving} className={button} onClick={onClose}>Hủy</button>
        <button type="submit" disabled={saving} className={primary}>{saving ? "Đang lưu…" : plan ? "Lưu thay đổi" : "Tạo kế hoạch"}</button></div>
    </form>
  </dialog>;
}
