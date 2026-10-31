import { useState } from "react";
import SmartSelect from "../common/SmartSelect";
import useModalDialog from "../common/useModalDialog";
import { input, button, primary } from "../finance/ui";

export default function CategoryEditorDialog({ item, type, groups, onSave, onClose }) {
  const [name, setName] = useState(item?.name || "");
  const [icon, setIcon] = useState(item?.icon || (type === "income" ? "↙" : "•"));
  const [groupId, setGroupId] = useState(item?.groupId || (type === "income" ? "income" : groups[0]?.id || ""));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const modal = useModalDialog(onClose, busy);
  async function submit(event) {
    event.preventDefault();
    if (!name.trim() || !groupId) { setError("Hãy nhập tên và chọn nhóm."); return; }
    setBusy(true); setError("");
    try { await onSave({ name: name.trim(), icon: icon.trim() || "•", groupId }); onClose(); }
    catch (reason) { setError(reason?.message || "Không lưu được danh mục."); }
    finally { setBusy(false); }
  }
  return <dialog ref={modal.ref} onCancel={modal.onCancel} aria-labelledby="category-editor-heading"
    className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg overflow-visible rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-6">
    <div className="mb-5 flex items-start justify-between gap-3">
      <div><h2 id="category-editor-heading" className="text-xl font-extrabold">{item ? "Sửa danh mục" : "Thêm danh mục"}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{type === "income" ? "Danh mục thu nhập" : "Danh mục chi tiêu"} · Lưu trực tiếp lên Firebase</p></div>
      <button type="button" aria-label="Đóng" className={`${button} !min-h-9 !px-3`} disabled={busy} onClick={onClose}>✕</button>
    </div>
    <form onSubmit={submit} className="grid gap-4">
      <fieldset disabled={busy} className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold">Tên danh mục
          <input autoFocus required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="VD: Ăn uống" className={input}/>
        </label>
        <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
          <label className="grid gap-2 text-sm font-semibold">Biểu tượng
            <input aria-label="Biểu tượng danh mục" maxLength={8} value={icon} onChange={(event) => setIcon(event.target.value)} className={`${input} text-center text-xl`} />
          </label>
          {type === "expense" && <div className="grid min-w-0 gap-2"><label className="text-sm font-semibold">Nhóm chi tiêu</label>
            <SmartSelect label="Nhóm chi tiêu của danh mục" value={groupId} onChange={setGroupId}
              options={groups.map((group) => ({ value: group.id, label: group.name }))}/>
          </div>}
        </div>
      </fieldset>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <button type="button" className={button} disabled={busy} onClick={onClose}>Hủy</button>
        <button type="submit" disabled={busy || !name.trim() || !groupId} className={primary}>{busy ? "Đang lưu…" : "Lưu danh mục"}</button>
      </div>
    </form>
  </dialog>;
}
