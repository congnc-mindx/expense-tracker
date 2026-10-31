import { useState } from "react";
import useModalDialog from "../common/useModalDialog";
import { button, primary, input } from "../finance/ui";

const makeId = () => `group_custom_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
export default function GroupManagerDialog({ groups, expense, onSave, onClose }) {
  const [draft, setDraft] = useState(() => groups.map((g) => ({ ...g })));
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const modal = useModalDialog(onClose, busy);
  function addGroup() {
    const name = newName.trim();
    if (!name) return;
    setDraft((prev) => [...prev, { id: makeId(), name }]);
    setNewName(""); setError("");
  }
  function removeGroup(id) {
    const children = expense.filter((item) => item.groupId === id);
    if (children.length) { setError(`Nhóm này có ${children.length} danh mục. Hãy chuyển hoặc xóa danh mục trước.`); return; }
    if (!window.confirm("Xóa nhóm chi tiêu đang trống này?")) return;
    setDraft((prev) => prev.filter((item) => item.id !== id)); setError("");
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError("");
    try { await onSave(draft); onClose(); }
    catch (reason) { setError(reason?.message || "Không lưu được nhóm."); }
    finally { setBusy(false); }
  }
  return <dialog ref={modal.ref} onCancel={modal.onCancel} aria-labelledby="group-editor-heading"
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden open:flex rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
      <div><h2 id="group-editor-heading" className="text-xl font-extrabold">Quản lý nhóm chi tiêu</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Đổi tên hoặc tạo nhóm; nhóm đang có danh mục không thể xóa.</p></div>
      <button type="button" aria-label="Đóng" className={`${button} !min-h-9 !px-3`} disabled={busy} onClick={onClose}>✕</button>
    </div>
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <fieldset disabled={busy} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
        {draft.map((group) => <div key={group.id} className="flex items-center gap-2">
          <input aria-label={`Tên nhóm ${group.name}`} maxLength={80} value={group.name}
            onChange={(event) => setDraft((old) => old.map((x) => x.id === group.id ? { ...x, name: event.target.value } : x))} className={`${input} !text-sm`} />
          <button type="button" className={`${button} !px-3`} onClick={() => removeGroup(group.id)}>Xóa</button>
        </div>)}
        <div className="flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <input aria-label="Tên nhóm mới" maxLength={80} placeholder="Thêm nhóm mới…" value={newName} className={input} onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addGroup(); } }}/>
          <button type="button" onClick={addGroup} className={`${button} shrink-0`}>+ Thêm</button>
        </div>
      </fieldset>
      {error && <p role="alert" className="mx-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-100 p-5 dark:border-slate-800">
        <button type="button" className={button} disabled={busy} onClick={onClose}>Hủy</button>
        <button type="submit" className={primary} disabled={busy}>{busy ? "Đang lưu…" : "Lưu nhóm"}</button>
      </div>
    </form>
  </dialog>;
}
