import useIncrementalList from "../common/useIncrementalList";
import LoadMoreButton from "../common/LoadMoreButton";
import { useState } from "react";
import useModalDialog from "../common/useModalDialog";
import { socialName } from "../../utils/social";
import { formatMoney } from "../../utils/money";
import { button, primary, muted } from "../finance/ui";

/** One place for inspecting, editing and deleting recorded events of a person. */
export default function SocialHistoryDialog({ person, onClose, onAdd, onEdit, onDelete }) {
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const modal = useModalDialog(onClose, deleting);
  const entries = [...person.entries].sort((a, b) =>
    b.date.localeCompare(a.date) || Number(b.createdAt || 0) - Number(a.createdAt || 0),
  );

  const paging = useIncrementalList(entries, [person.key], 10);
  async function confirmDelete(id) {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try {
      await onDelete(id);
      setPendingDelete(null);
    } catch (reason) {
      setError(reason.message || "Chưa xóa được khoản ghi nhận.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <dialog ref={modal.ref} onCancel={modal.onCancel} aria-labelledby="social-history-title"
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/65 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <div className="flex max-h-[90dvh] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="min-w-0">
            <h2 id="social-history-title" className="break-words text-xl font-extrabold">{person.name}</h2>
            <p className={`mt-1 ${muted}`}>{person.group} · {entries.length} lần ghi nhận</p>
          </div>
          <button type="button" className={`${button} !size-9 !min-h-9 shrink-0 !p-0`} aria-label="Đóng lịch sử" disabled={deleting} onClick={onClose}>×</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="min-w-0 rounded-xl bg-rose-50 p-3 dark:bg-rose-950/20">
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">Mình gửi</p>
              <p className="mt-1 break-words text-base font-bold tabular-nums">{formatMoney(person.given)}</p>
            </div>
            <div className="min-w-0 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/20">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Họ gửi</p>
              <p className="mt-1 break-words text-base font-bold tabular-nums">{formatMoney(person.received)}</p>
            </div>
          </div>
          {error && <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {paging.visible.map((entry) => (
              <article key={entry.id} className="py-3.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <div className="min-w-0 flex-[1_1_220px]">
                    <p className="text-sm font-bold">
                      {socialName(entry.occasion)}
                      <span className={`ml-2 text-xs font-semibold ${entry.direction === "given" ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                        {entry.direction === "given" ? "Mình gửi" : "Họ gửi"}
                      </span>
                    </p>
                    <p className={`mt-1 break-words text-xs ${muted}`}>
                      {entry.date.split("-").reverse().join("/")}{entry.note ? ` · ${entry.note}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-extrabold tabular-nums">{formatMoney(entry.amount)}</p>
                  <div className="flex gap-2">
                    <button type="button" className={`${button} !min-h-9 !px-3 !text-xs`} disabled={deleting} onClick={() => onEdit(entry)}>Sửa</button>
                    <button type="button" className={`${button} !min-h-9 !px-3 !text-xs`} disabled={deleting} onClick={() => setPendingDelete(entry.id)}>Xóa</button>
                  </div>
                </div>
                {pendingDelete === entry.id && (
                  <div className="mt-2 flex flex-wrap items-center justify-end gap-2 rounded-lg bg-rose-50 p-2.5 text-xs dark:bg-rose-950/20">
                    <span className="mr-auto font-semibold text-rose-700 dark:text-rose-300">Xóa khoản này khỏi sổ và báo cáo thu/chi?</span>
                    <button type="button" className={`${button} !min-h-8 !px-3 !text-xs`} disabled={deleting} onClick={() => setPendingDelete(null)}>Hủy</button>
                    <button type="button" className="min-h-8 rounded-lg bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50" disabled={deleting} onClick={() => confirmDelete(entry.id)}>{deleting ? "Đang xóa…" : "Xác nhận xóa"}</button>
                  </div>
                )}
              </article>
            ))}
          </div>
          <LoadMoreButton remaining={paging.remaining} batch={10} onClick={paging.loadMore} noun="khoản" />
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3.5 dark:border-slate-800 sm:px-6">
          <button type="button" className={button} disabled={deleting} onClick={onClose}>Đóng</button>
          <button type="button" className={primary} disabled={deleting} onClick={onAdd}>+ Thêm lần mới</button>
        </div>
      </div>
    </dialog>
  );
}
