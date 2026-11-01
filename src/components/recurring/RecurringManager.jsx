import { useState } from "react";
import RecurringRuleDialog from "./RecurringRuleDialog";
import { useCategories } from "../../context/CategoryContext";
import { formatMoney } from "../../utils/money";
import { recurringType } from "../../utils/recurringExpenses";
import { button, primary, muted, panel } from "../finance/ui";
import useIncrementalList from "../common/useIncrementalList";
import LoadMoreButton from "../common/LoadMoreButton";

/** Shared management surface for recurring income AND expense, including legacy expense rules. */
export default function RecurringManager({ rules, month, onSave, onRemove, onToggle, onCreate, busy, error }) {
  const { getCategoryById } = useCategories();
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [working, setWorking] = useState("");
  const [localError, setLocalError] = useState("");
  const visibleRules = rules.filter((rule) => !rule.archived);
  const filtered = visibleRules.filter(rule => filter === "all" || recurringType(rule) === filter)
    .sort((a, b) => Number(b.active) - Number(a.active) || (b.updatedAt || 0) - (a.updatedAt || 0));
  const paging = useIncrementalList(filtered, [filter], 10);
  const income = visibleRules.filter(rule => recurringType(rule) === "income").length;
  const expense = visibleRules.filter(rule => recurringType(rule) === "expense").length;

  async function apply(action, rule) {
    if (busy || working) return;
    setWorking(rule.id); setLocalError("");
    try { await action(rule); }
    catch (reason) { setLocalError(reason.message || "Không cập nhật được lịch định kỳ."); }
    finally { setWorking(""); }
  }
  return <section className={`${panel} min-w-0`} aria-label="Quản lý khoản định kỳ">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-lg font-extrabold">Khoản thu chi định kỳ</h2>
        <p className={`mt-1 max-w-2xl ${muted}`}>Khoản chi tự tính từ tháng đến hạn; khoản thu khác vẫn ghi nhận khi nhận tiền.</p></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} onClick={() => onCreate("expense")}>+ Khoản chi</button>
        <button type="button" className={primary} onClick={() => onCreate("income")}>+ Khoản thu</button>
      </div>
    </div>
    <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Lọc loại khoản định kỳ">
      {[["all", `Tất cả (${visibleRules.length})`], ["expense", `Khoản chi (${expense})`], ["income", `Khoản thu (${income})`]].map(([value, label]) =>
        <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}
          className={`${filter === value ? primary : button} !min-h-9 !rounded-lg !px-3 !text-xs`}>{label}</button>)}
    </div>
    {(localError || error) && <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-400">{localError || error}</p>}
    {filtered.length ? <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
      {paging.visible.map(rule => <article key={rule.id} className="flex flex-wrap items-center gap-3 py-4">
        <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-xl ${recurringType(rule) === "income" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40" : "bg-rose-100 text-rose-700 dark:bg-rose-950/30"}`}>{recurringType(rule) === "income" ? "↙" : "↗"}</span>
        <div className="min-w-0 flex-[1_1_200px]">
          <p className="break-words text-sm font-bold">{rule.title}</p>
          <p className={`mt-1 text-xs ${muted}`}>{recurringType(rule) === "income" ? "Khoản thu" : "Khoản chi"} · Ngày {rule.day} mỗi tháng · {getCategoryById(rule.category).name}</p>
          <p className={`mt-1 text-xs font-semibold ${rule.active ? "text-emerald-700 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>{rule.active ? "Đang lặp" : "Tạm dừng"}{rule.endMonth ? ` · Kết thúc ${rule.endMonth}` : ""}</p>
        </div>
        <p className={`font-bold tabular-nums ${recurringType(rule) === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{recurringType(rule) === "income" ? "+" : "−"}{formatMoney(rule.amount)}</p>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" disabled={busy || Boolean(working)} className={`${button} !min-h-9 !px-3 !text-xs`} onClick={() => setEditing(rule)}>Sửa</button>
          <button type="button" disabled={busy || Boolean(working)} className={`${button} !min-h-9 !px-3 !text-xs`} onClick={() => apply(onToggle, rule)}>{rule.active ? "Tạm dừng" : "Tiếp tục"}</button>
          <button type="button" disabled={busy || Boolean(working)} className={`${button} !min-h-9 !px-3 !text-xs`} onClick={() => apply(onRemove, rule)}>Xóa</button>
        </div>
      </article>)}
      <LoadMoreButton remaining={paging.remaining} batch={10} onClick={paging.loadMore} noun="lịch" />
    </div> : <div className="mt-5 rounded-xl border border-dashed border-[#dce9df] px-5 py-10 text-center text-sm text-slate-500 dark:border-slate-700">Chưa có lịch phù hợp. Bạn có thể tạo ngay từ nút Thêm giao dịch hoặc tại đây.</div>}
    {editing && <RecurringRuleDialog rule={editing} month={month} onSave={onSave} onClose={() => setEditing(null)}/>}
  </section>;
}
