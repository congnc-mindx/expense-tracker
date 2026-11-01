import useModalDialog from "../common/useModalDialog";
import { button, primary, muted } from "../finance/ui";
import { formatMoney } from "../../utils/money";
import { planCategory, planFunding, planProgress, planTasksProgress } from "../../utils/plans";

export default function PlanDetailsDialog({ plan, busy, onClose, onEdit, onToggleTask }) {
  const dialog = useModalDialog(onClose, busy);
  const category = planCategory(plan.category);
  const funding = planFunding(plan);
  const progress = planProgress(plan);
  const tasks = planTasksProgress(plan);
  return <dialog ref={dialog.ref} onCancel={dialog.onCancel} aria-labelledby="plan-details-title"
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-[780px] overflow-y-auto rounded-[24px] border border-[#dce9df] bg-white p-5 text-slate-900 shadow-2xl backdrop:bg-slate-950/65 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-7">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className={`text-sm font-semibold ${muted}`}>{category.icon} {category.label}</p>
        <h2 id="plan-details-title" className="mt-1 break-words text-xl font-extrabold sm:text-2xl">{plan.title}</h2>
        <p className={`mt-1 ${muted}`}>{plan.targetDate ? `Dự kiến: ${plan.targetDate.split("-").reverse().join("/")}` : "Chưa đặt hạn hoàn thành"}</p>
      </div>
      <button type="button" className={`${button} shrink-0 !px-3`} onClick={onClose} disabled={busy} aria-label="Đóng">✕</button>
    </div>
    {plan.note && <p className="mt-4 whitespace-pre-wrap break-words text-sm text-slate-500 dark:text-slate-400">{plan.note}</p>}
    <div className="mt-5 grid gap-3 rounded-2xl bg-[#f1f8f3] p-4 dark:bg-slate-950/60 sm:grid-cols-3">
      <div><p className="text-xs font-semibold text-slate-500">Mục tiêu</p><p className="mt-1 text-base font-extrabold tabular-nums">{formatMoney(plan.targetAmount)}</p></div>
      <div><p className="text-xs font-semibold text-slate-500">Đã chuẩn bị</p><p className="mt-1 text-base font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">{formatMoney(progress.prepared)}</p></div>
      <div><p className="text-xs font-semibold text-slate-500">Còn thiếu</p><p className="mt-1 text-base font-extrabold tabular-nums">{formatMoney(progress.remaining)}</p></div>
    </div>
    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#e5efe7] dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-500" style={{width:`${progress.width}%`}} /></div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-extrabold">Các đầu việc · {tasks.done}/{tasks.total}</h3>
      <span className={`text-xs ${muted}`}>Chi phí liệt kê: {formatMoney(funding.estimated)}</span>
    </div>
    <div className="mt-3 overflow-hidden rounded-xl border border-[#e1ebe4] dark:border-slate-700">
      {plan.tasks?.length ? plan.tasks.map((task) => <div key={task.id} className="grid min-w-0 items-center gap-2 border-b border-[#edf2ee] p-3 last:border-0 dark:border-slate-800 sm:grid-cols-[minmax(0,1fr)_minmax(0,120px)_minmax(0,120px)] sm:gap-4">
        <label className="flex min-w-0 cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" className="size-4 shrink-0 accent-emerald-600" checked={Boolean(task.done)} disabled={busy || plan.status === "completed"} onChange={(event) => onToggleTask(plan,task.id,event.target.checked)}/>
          <span className={`min-w-0 break-words ${task.done ? "text-slate-400 line-through" : ""}`}>{task.title}</span>
        </label>
        <div className="grid grid-cols-2 gap-3 pl-7 sm:contents">
          <div><p className="text-[11px] font-semibold text-slate-500">Dự kiến</p><p className="mt-0.5 text-sm font-bold tabular-nums">{formatMoney(Number(task.estimatedAmount) || 0)}</p></div>
          <div><p className="text-[11px] font-semibold text-slate-500">Đã chuẩn bị</p><p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{formatMoney(Number(task.preparedAmount) || 0)}</p></div>
        </div>
      </div>) : <p className={`p-4 text-sm ${muted}`}>Chưa có đầu việc. Bạn có thể thêm trong phần Sửa kế hoạch.</p>}
    </div>
    <p className={`mt-3 text-xs ${muted}`}>Quỹ chung chưa phân bổ: {formatMoney(Number(plan.savedAmount) || 0)} · Tổng chuẩn bị gồm quỹ chung và từng đầu việc.</p>
    <div className="mt-6 flex justify-end gap-2 border-t border-[#e1ebe4] pt-4 dark:border-slate-700">
      <button type="button" className={button} onClick={onClose} disabled={busy}>Đóng</button>
      <button type="button" className={primary} disabled={busy} onClick={() => onEdit(plan)}>Sửa kế hoạch</button>
    </div>
  </dialog>;
}
