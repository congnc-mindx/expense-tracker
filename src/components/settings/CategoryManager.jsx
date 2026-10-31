import { useState } from "react";
import { panel, button, input, muted, primary } from "../finance/ui";
import { validateCategoryConfig } from "../../utils/categoryConfig";

const createId = (type) => `${type}_custom_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
export default function CategoryManager({ initial, onSave }) {
  const [draft, setDraft] = useState(() => structuredClone(initial));
  const [newNames, setNewNames] = useState({});
  const [newGroup, setNewGroup] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  function changeDraft(fn) { setDraft((old) => fn(structuredClone(old))); setDirty(true); setError(""); setMessage(""); }
  function edit(group, id, value) { changeDraft((data) => { const found = data[group].find((x) => x.id === id); if (found) found.name = value; return data; }); }
  function toggle(type, id) { changeDraft((data) => { const item = data[type].find((x) => x.id === id); if (item && !item.locked) item.hidden = !item.hidden; return data; }); }
  function add(type, groupId) {
    const key = `${type}:${groupId}`;
    const name = String(newNames[key] || "").trim();
    if (!name) return;
    changeDraft((data) => { data[type].push({ id: createId(type), name, groupId, icon: type === "income" ? "↙" : "•", type, hidden: false }); return data; });
    setNewNames((prev) => ({ ...prev, [key]: "" }));
  }
  function addGroup() {
    const name = newGroup.trim(); if (!name) return;
    changeDraft((data) => { data.groups.push({ id: createId("group"), name }); return data; }); setNewGroup("");
  }
  async function save() {
    if (saving || !dirty) return;
    setSaving(true); setError(""); setMessage("");
    try { const clean = validateCategoryConfig(draft); await onSave(clean); setDirty(false); setMessage("Đã cập nhật danh mục trên Firebase."); }
    catch (e) { setError(e.message || "Không lưu được danh mục."); }
    finally { setSaving(false); }
  }
  function categoryRows(type, groupId) {
    const items = draft[type].filter((cat) => cat.groupId === groupId);
    return <div className="grid gap-2">
      {items.map((cat) => <div key={cat.id} className={`flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 p-2 dark:border-slate-700 ${cat.hidden ? "opacity-60" : ""}`}>
        <span className="w-5 shrink-0 text-center text-lg">{cat.icon}</span>
        <input aria-label={`Tên danh mục ${cat.name}`} value={cat.name} disabled={cat.locked || saving} maxLength={80} onChange={(e)=>edit(type, cat.id, e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-2 text-sm font-semibold outline-none hover:border-slate-300 focus:border-blue-500 dark:hover:border-slate-700"/>
        {cat.locked ? <span className="shrink-0 text-[11px] text-slate-500">Tự động</span> : <button type="button" disabled={saving} className={`${button} !min-h-9 !px-2.5 !text-xs`} onClick={() => toggle(type, cat.id)}>{cat.hidden ? "Hiện" : "Ẩn"}</button>}
      </div>)}
      <div className="flex items-center gap-2 pt-1">
        <input className={`${input} min-w-0 !min-h-10 !text-sm`} aria-label="Tên danh mục mới" placeholder="Thêm danh mục…" value={newNames[`${type}:${groupId}`] || ""} maxLength={80} onChange={(e)=>setNewNames((p)=>({...p,[`${type}:${groupId}`]:e.target.value}))} onKeyDown={(e)=>{if(e.key==="Enter"){e.preventDefault(); add(type,groupId);}}}/>
        <button type="button" className={`${button} !min-h-10 shrink-0 !px-3`} onClick={()=>add(type,groupId)}>Thêm</button>
      </div>
    </div>;
  }
  return <section className={panel}>
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-lg font-extrabold">Quản lý danh mục</h2><p className={`mt-2 max-w-2xl ${muted}`}>Đổi tên, thêm mới hoặc ẩn danh mục không còn sử dụng. Danh mục ẩn vẫn xuất hiện trong các giao dịch cũ; mã định danh được giữ nguyên để không làm sai báo cáo.</p></div>
      <button type="button" className={primary} disabled={saving || !dirty} onClick={save}>{saving ? "Đang lưu…" : "Lưu thay đổi"}</button>
    </div>
    {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
    {message && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{message}</p>}
    {dirty && <p className="mb-4 text-xs font-semibold text-amber-600 dark:text-amber-400">Có thay đổi chưa lưu lên Firebase.</p>}
    <div className="grid gap-6 lg:grid-cols-2">
      {draft.groups.map((group) => <div key={group.id} className="min-w-0 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <label className="mb-3 grid gap-2 text-xs font-bold text-slate-500">Tên nhóm chi tiêu
          <input aria-label={`Tên nhóm ${group.name}`} maxLength={80} className={`${input} !text-sm font-bold`} disabled={saving} value={group.name} onChange={(e)=>edit("groups",group.id,e.target.value)}/>
        </label>
        {categoryRows("expense", group.id)}
      </div>)}
      <div className="min-w-0 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="mb-3 font-bold">Nhóm chi tiêu mới</h3>
        <div className="flex gap-2"><input className={`${input} min-w-0 !text-sm`} value={newGroup} maxLength={80} placeholder="VD: Học tập" onChange={(e)=>setNewGroup(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"){e.preventDefault();addGroup();}}}/><button type="button" className={button} onClick={addGroup}>Thêm nhóm</button></div>
      </div>
      <div className="min-w-0 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="mb-3 font-bold">Danh mục thu nhập</h3>
        {categoryRows("income", "income")}
      </div>
    </div>
    <div className="mt-5 flex justify-end"><button className={primary} type="button" disabled={saving || !dirty} onClick={save}>{saving ? "Đang lưu…" : "Lưu danh mục lên Firebase"}</button></div>
  </section>;
}
