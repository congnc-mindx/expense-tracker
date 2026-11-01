import useIncrementalList from "../components/common/useIncrementalList";
import LoadMoreButton from "../components/common/LoadMoreButton";
import { useMemo, useState } from "react";
import { panel, button, primary, input, muted } from "../components/finance/ui";
import { formatMoney } from "../utils/money";
import { filteredPlans, planCategory, planDeadline, planFunding, planProgress, planTasksProgress, validatePlan } from "../utils/plans";
import PlanDialog from "../components/plans/PlanDialog";
import CelebrationDialog from "../components/plans/CelebrationDialog";
import PlanDetailsDialog from "../components/plans/PlanDetailsDialog";
import { useEffect, useRef } from "react";

function PlanCard({ plan, busy, onView, onEdit, onRemove, onToggleCompleted, onToggleTask }) {
  const progress = planProgress(plan);
  const funding = planFunding(plan);
  const tasks = planTasksProgress(plan);
  const completed = plan.status === "completed";
  const deadline = planDeadline(plan);
  const category = planCategory(plan.category);
  return <article className={`${panel} flex min-w-0 flex-col gap-4`}>
    <div className="flex items-start justify-between gap-2">
      <button type="button" className="flex min-w-0 items-start gap-3 text-left focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-emerald-600" onClick={() => onView(plan)}>
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eef6ef] text-xl text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{completed ? "✓" : category.icon}</span>
        <span className="min-w-0"><span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">{category.label}</span>
          <span className="mt-1 block break-words text-base font-extrabold leading-snug hover:text-emerald-700 dark:hover:text-emerald-400 sm:text-lg">{plan.title}</span>
        </span>
      </button>
      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-1 py-2 text-xs font-semibold sm:text-sm">
        <input type="checkbox" className="size-4 shrink-0 accent-emerald-600" checked={completed} disabled={busy} onChange={(event) => onToggleCompleted(plan, event.target.checked)}/>
        Hoàn thành
      </label>
    </div>
    <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#f5faf6] p-3 dark:bg-slate-950/40">
      <div className="min-w-0"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mục tiêu</p><p className="mt-1 break-words text-sm font-extrabold tabular-nums sm:text-base">{formatMoney(plan.targetAmount)}</p></div>
      <div className="min-w-0"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đã chuẩn bị</p><p className="mt-1 break-words text-sm font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-base">{formatMoney(progress.prepared)}</p></div>
    </div>
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold"><span>{completed ? "Đã hoàn thành" : `Đã chuẩn bị ${progress.percentage}%`}</span>
        <span className="text-slate-500 dark:text-slate-400">{completed ? "✓" : `Còn ${formatMoney(progress.remaining)}`}</span></div>
      <div role="progressbar" aria-label={`Tiến độ chuẩn bị tiền cho ${plan.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.width} className="h-2.5 overflow-hidden rounded-full bg-[#e5efe7] dark:bg-slate-800">
        <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${progress.width}%` }} />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={`${deadline === "overdue" ? "font-bold text-rose-600 dark:text-rose-400" : deadline === "today" ? "font-bold text-amber-700 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>
          {plan.targetDate ? `◎ Dự kiến: ${plan.targetDate.split("-").reverse().join("/")}` : "◎ Chưa đặt ngày dự kiến"}
        </span>
        {deadline === "overdue" && <span className="shrink-0 font-bold text-rose-600 dark:text-rose-400">Quá hạn</span>}
      </div>
    </div>
    {plan.tasks?.length > 0 && <div className="grid gap-2 border-t border-[#edf2ee] pt-3 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-slate-500 dark:text-slate-400">Việc cần làm · {tasks.done}/{tasks.total}</p><span className="text-[11px] text-slate-500">Dự chi: {formatMoney(funding.estimated)}</span></div>
      {plan.tasks.slice(0, 3).map((task) => <div key={task.id} className="flex min-w-0 items-center justify-between gap-2 text-sm">
        <label className="flex min-w-0 cursor-pointer items-center gap-2">
          <input type="checkbox" checked={Boolean(task.done)} disabled={busy || completed} onChange={(event) => onToggleTask(plan, task.id, event.target.checked)} className="size-4 shrink-0 accent-emerald-600" />
          <span className={`min-w-0 truncate ${task.done ? "text-slate-400 line-through" : ""}`}>{task.title}</span>
        </label>
        <span className="shrink-0 text-xs tabular-nums text-emerald-700 dark:text-emerald-400">{formatMoney(Number(task.preparedAmount)||0)}</span>
      </div>)}
      {plan.tasks.length > 3 && <button type="button" className="text-left text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400" onClick={() => onView(plan)}>+{plan.tasks.length - 3} việc khác · Xem chi tiết</button>}
    </div>}
    <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-[#edf2ee] pt-3 dark:border-slate-800">
      <button type="button" className={`${button} !min-h-9 !px-3`} onClick={() => onView(plan)}>Xem chi tiết</button>
      <button type="button" disabled={busy} className={`${button} !min-h-9 !px-3`} onClick={() => onEdit(plan)}>Sửa</button>
      <button type="button" disabled={busy} className={`${button} !min-h-9 !px-3 text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:text-rose-400`} onClick={() => onRemove(plan)}>Xóa</button>
    </div>
  </article>;
}

export default function PlansPage({ store, addSignal = 0 }) {
  const [filter, setFilter] = useState("active");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(undefined);
  const [viewingId, setViewingId] = useState(null);
  const lastSignal = useRef(addSignal);
  useEffect(() => {
    if (addSignal !== lastSignal.current) { lastSignal.current = addSignal; setViewingId(null); setEditing(null); }
  }, [addSignal]);
  const [celebration, setCelebration] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const plans = useMemo(() => filteredPlans(store.rows, { filter, query }), [store.rows, filter, query]);
  const paging = useIncrementalList(plans, [filter,query], 10);
  const total = store.rows.length;
  const active = store.rows.filter((item) => item.status !== "completed").length;
  const done = total - active;
  const unfinished = store.rows.filter((item) => item.status !== "completed");
  const plannedCost = unfinished.reduce((sum, item) => sum + (Number(item.targetAmount) || 0), 0);
  const totalPrepared = store.rows.reduce((sum, item) => sum + planProgress(item).prepared, 0);
  const viewingPlan = store.rows.find((item) => item.id === viewingId);

  async function savePlan(next, id) {
    if (store.loading || store.error) throw new Error(store.error || "Firebase chưa tải xong.");
    const original = id ? store.rows.find((item) => item.id === id) : null;
    if (id && !original) throw new Error("Kế hoạch không còn tồn tại.");
    await store.save(id || crypto.randomUUID(), {
      ...validatePlan(next),
      createdAt: original?.createdAt || Date.now(),
      updatedAt: Date.now(),
      completedAt: original?.completedAt || null,
    });
    setError("");
  }

  async function toggleCompleted(plan, checked) {
    if (busyId) return;
    setBusyId(plan.id); setError("");
    try {
      const { id: documentId, ...data } = plan;
      await store.save(documentId, {
        ...data, status: checked ? "completed" : "active",
        completedAt: checked ? Date.now() : null,
        updatedAt: Date.now(),
      });
      if (checked) setCelebration({ id: plan.id, title: plan.title });
    } catch (reason) { setError(reason?.message || "Chưa cập nhật được kế hoạch."); }
    finally { setBusyId(null); }
  }

  async function toggleTask(plan, taskId, checked) {
    if (busyId) return;
    setBusyId(plan.id); setError("");
    try {
      const { id: documentId, ...data } = plan;
      await store.save(documentId, {
        ...data,
        tasks: plan.tasks.map((task) => task.id === taskId ? { ...task, done: checked } : task),
        updatedAt: Date.now(),
      });
    } catch (reason) { setError(reason?.message || "Chưa lưu được đầu việc."); }
    finally { setBusyId(null); }
  }

  async function removePlan(plan) {
    if (busyId || !window.confirm(`Xóa kế hoạch “${plan.title}” và tất cả đầu việc? Thao tác này không thể hoàn tác.`)) return;
    setBusyId(plan.id); setError("");
    try { await store.remove(plan.id); }
    catch (reason) { setError(reason?.message || "Chưa xóa được kế hoạch."); }
    finally { setBusyId(null); }
  }

  return <div className="grid min-w-0 gap-5 sm:gap-6">
    {(error || store.error) && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error || store.error}</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <section className={panel}><p className="text-xs font-bold text-slate-500">Đang thực hiện</p><p className="mt-2 text-3xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">{active}</p></section>
      <section className={panel}><p className="text-xs font-bold text-slate-500">Đã hoàn thành</p><p className="mt-2 text-3xl font-extrabold tabular-nums">{done}</p></section>
      <section className={panel}><p className="text-xs font-bold text-slate-500">Tổng chi phí dự kiến chưa hoàn thành</p><p className="mt-2 break-words text-2xl font-extrabold tabular-nums">{formatMoney(plannedCost)}</p></section>
      <section className={panel}><p className="text-xs font-bold text-slate-500">Tổng chi phí đã chuẩn bị</p><p className="mt-2 break-words text-2xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">{formatMoney(totalPrepared)}</p></section>
    </div>
    <section className={panel}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <label className="grid min-w-0 flex-1 gap-2 text-sm font-semibold md:max-w-lg">Tìm kế hoạch
          <input type="search" className={input} placeholder="Tên kế hoạch, nhóm, ghi chú…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div role="group" aria-label="Lọc kế hoạch" className="grid grid-cols-3 gap-1 rounded-xl bg-[#eef5f0] p-1 dark:bg-slate-800">
          {[["active", "Đang làm"], ["completed", "Hoàn thành"], ["all", "Tất cả"]].map(([value, label]) =>
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}
              className={`min-h-10 rounded-lg px-3 text-xs font-bold transition-colors sm:text-sm ${filter === value ? "bg-white text-emerald-800 shadow-sm dark:bg-slate-700 dark:text-emerald-300" : "text-slate-500 hover:text-emerald-700 dark:text-slate-300"}`}>
              {label}
            </button>)}
        </div>
      </div>
    </section>
    {store.rows.length === 0 ? <section className={`${panel} grid justify-items-center gap-3 py-12 text-center`}>
      <span className="grid size-16 place-items-center rounded-2xl bg-emerald-50 text-3xl text-emerald-700 dark:bg-emerald-950/40">✦</span>
      <h2 className="text-lg font-extrabold">Một kế hoạch bắt đầu từ hôm nay</h2>
      <p className={`max-w-md ${muted}`}>Tạo mục tiêu đầu tiên, ước tính số tiền và ngày muốn hoàn thành. Bạn có thể chia mục tiêu thành những đầu việc nhỏ.</p>
      <button type="button" className={primary} onClick={() => setEditing(null)}>+ Tạo kế hoạch đầu tiên</button>
    </section> : plans.length === 0 ? <section className={`${panel} py-10 text-center ${muted}`}>Không có kế hoạch phù hợp với bộ lọc hiện tại.</section> :
      <div className="grid min-w-0 items-stretch gap-4 lg:grid-cols-2 2xl:grid-cols-3">{paging.visible.map((plan) => <PlanCard key={plan.id} plan={plan} busy={busyId !== null} onView={(p) => setViewingId(p.id)} onEdit={setEditing} onRemove={removePlan} onToggleCompleted={toggleCompleted} onToggleTask={toggleTask} />)}</div>}
    <LoadMoreButton remaining={paging.remaining} batch={10} onClick={paging.loadMore} noun="kế hoạch" />
    <p className={`text-xs ${muted}`}>Các kế hoạch và tiền đã chuẩn bị là số liệu theo dõi riêng; chỉ giao dịch thật trong Thu nhập/Chi tiêu mới ảnh hưởng đến báo cáo tài chính.</p>
    {viewingPlan && <PlanDetailsDialog plan={viewingPlan} busy={busyId !== null} onClose={() => setViewingId(null)} onEdit={(p) => { setViewingId(null); setEditing(p); }} onToggleTask={toggleTask} />}
    {editing !== undefined && <PlanDialog plan={editing} onSave={savePlan} onClose={() => setEditing(undefined)} />}
    {celebration && <CelebrationDialog plan={celebration} onClose={() => setCelebration(null)} />}
  </div>;
}
