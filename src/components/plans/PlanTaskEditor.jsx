import { useState } from "react";
import MoneyEquivalent from "../common/MoneyEquivalent";
import { input, button } from "../finance/ui";

/** Optional, collapsible list of plan tasks. Parent owns data and persistence. */
export default function PlanTaskEditor({ tasks, newTask, onNewTaskChange, onAddTask, onChangeTask, onRemoveTask, funding }) {
  const [expanded, setExpanded] = useState(tasks.length > 0);
  const done = tasks.filter((task) => task.done).length;
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 dark:border-slate-700">
      <button type="button" aria-controls="plan-task-content" aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:hover:bg-slate-800/50"
        onClick={() => setExpanded((value) => !value)}>
        <span className="min-w-0">
          <span className="block text-sm font-bold">Đầu việc & phân bổ tiền <span className="text-slate-500">({tasks.length})</span></span>
          <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">{tasks.length ? `${done}/${tasks.length} hoàn thành` : "Tùy chọn · thêm khi cần"}</span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-xl font-light text-slate-500">{expanded ? "−" : "+"}</span>
      </button>
      {expanded && <div id="plan-task-content" className="grid gap-3 border-t border-slate-200 p-3 dark:border-slate-700">
        {tasks.map((task) => <article key={task.id} className="grid min-w-0 gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
          <div className="flex min-w-0 items-center gap-2">
            <input type="checkbox" checked={task.done} className="size-4 shrink-0 accent-emerald-600"
              aria-label={`Hoàn thành ${task.title}`} onChange={(event) => onChangeTask(task.id, { done: event.target.checked })}/>
            <input aria-label="Tên đầu việc" value={task.title} maxLength={150} className={`${input} !min-h-9 min-w-0 flex-1 !py-1.5 !text-sm font-semibold`}
              onChange={(event) => onChangeTask(task.id, { title: event.target.value })}/>
            <button type="button" className={`${button} !min-h-9 !px-2.5`} aria-label={`Xóa đầu việc ${task.title}`} onClick={() => onRemoveTask(task.id)}>×</button>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <label className="grid min-w-0 gap-1 text-xs font-semibold"><span>Chi phí dự kiến <span className="font-normal text-slate-500">(nghìn đồng)</span></span>
              <input aria-label={`Chi phí dự kiến ${task.title}`} className={`${input} !min-h-10 !py-2 !text-sm`} inputMode="decimal" placeholder="0" value={task.estimatedText}
                onChange={(event) => onChangeTask(task.id, { estimatedText: event.target.value })}/>
              <MoneyEquivalent value={task.estimatedText}/>
            </label>
            <label className="grid min-w-0 gap-1 text-xs font-semibold"><span>Đã chuẩn bị <span className="font-normal text-slate-500">(nghìn đồng)</span></span>
              <input aria-label={`Đã chuẩn bị ${task.title}`} className={`${input} !min-h-10 !py-2 !text-sm`} inputMode="decimal" placeholder="0" value={task.preparedText}
                onChange={(event) => onChangeTask(task.id, { preparedText: event.target.value })}/>
              <MoneyEquivalent value={task.preparedText}/>
            </label>
          </div>
        </article>)}
        <div className="flex min-w-0 gap-2">
          <input className={`${input} min-w-0 flex-1 !text-sm`} aria-label="Thêm việc cần làm" placeholder="Thêm đầu việc…" value={newTask}
            maxLength={150} onChange={(event) => onNewTaskChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onAddTask(); } }} />
          <button type="button" className={`${button} shrink-0`} disabled={!newTask.trim() || tasks.length >= 40} onClick={onAddTask}>+ Thêm</button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs dark:bg-emerald-950/20">
          <span>Đã phân bổ theo đầu việc</span>
          <strong className="tabular-nums text-emerald-700 dark:text-emerald-400">{funding}</strong>
        </div>
      </div>}
    </section>
  );
}
