import { useEffect, useMemo, useState } from "react";
import SmartSelect from "../common/SmartSelect";
import CategoryEditorDialog from "./CategoryEditorDialog";
import GroupManagerDialog from "./GroupManagerDialog";
import { panel, button, input, muted, primary } from "../finance/ui";
import { validateCategoryConfig } from "../../utils/categoryConfig";
import { normalize } from "../../utils/finance";

const makeId = (type) => `${type}_custom_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;

export default function CategoryManager({ initial, onSave, usedCategoryIds = [] }) {
  const [config, setConfig] = useState(() => structuredClone(initial));
  const [type, setType] = useState("expense");
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [editor, setEditor] = useState(null);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Listen to Firebase snapshots without resetting filters, search, or the active tab.
  useEffect(() => { setConfig(structuredClone(initial)); }, [initial]);

  const items = useMemo(() => (config[type] || []).filter((cat) => {
    if (!showHidden && cat.hidden) return false;
    if (type === "expense" && groupFilter !== "all" && cat.groupId !== groupFilter) return false;
    const groupName = config.groups.find((group) => group.id === cat.groupId)?.name || "";
    return normalize(`${cat.name} ${groupName}`).includes(normalize(query));
  }), [config, type, query, groupFilter, showHidden]);
  const orderedGroups = type === "expense"
    ? config.groups.filter((group) => items.some((cat) => cat.groupId === group.id))
    : [{ id: "income", name: "Nguồn thu" }];
  const countActive = config[type].filter((cat) => !cat.hidden).length;
  const countHidden = config[type].filter((cat) => cat.hidden).length;
  const blocked = (id) => usedCategoryIds.includes(id);

  async function persist(next, success = "Đã lưu thay đổi danh mục lên Firebase.") {
    if (saving) return;
    const clean = validateCategoryConfig(next);
    setSaving(true); setError(""); setMessage("");
    try {
      await onSave(clean);
      setConfig(clean);
      setMessage(success);
    } catch (reason) {
      setError(reason?.message || "Không thể cập nhật danh mục.");
      throw reason;
    } finally { setSaving(false); }
  }

  async function saveCategory(fields) {
    const next = structuredClone(config);
    const existing = editor?.id ? next[type].find((cat) => cat.id === editor.id) : null;
    if (editor?.id && !existing) throw new Error("Không tìm thấy danh mục để sửa.");
    const duplicate = next[type].some((cat) => cat.id !== editor?.id && cat.groupId === (type === "income" ? "income" : fields.groupId)
      && normalize(cat.name) === normalize(fields.name));
    if (duplicate) throw new Error("Tên danh mục đã có trong nhóm này.");
    if (existing) Object.assign(existing, fields);
    else next[type].push({ id: makeId(type), type, name: fields.name, icon: fields.icon,
      groupId: type === "income" ? "income" : fields.groupId, hidden: false });
    await persist(next, existing ? "Đã cập nhật danh mục." : "Đã tạo danh mục mới.");
  }

  async function toggleCategory(cat) {
    if (saving || cat.locked) return;
    const next = structuredClone(config);
    const item = next[type].find((x) => x.id === cat.id);
    if (!item) return;
    item.hidden = !item.hidden;
    try { await persist(next, item.hidden ? "Đã ẩn danh mục khỏi form giao dịch mới." : "Đã hiện danh mục."); }
    catch { /* persist already displays the error */ }
  }

  async function removeCategory(cat) {
    if (saving || cat.locked) return;
    const id = cat.id;
    if (usedCategoryIds.includes(id)) {
      setError(`Danh mục “${cat.name}” đã được sử dụng trong giao dịch hoặc ngân sách. Hãy Ẩn để bảo vệ dữ liệu cũ.`);
      return;
    }
    if (!window.confirm(`Xóa danh mục “${cat.name}”? Thao tác này không thể hoàn tác.`)) return;
    const next = structuredClone(config);
    next[type] = next[type].filter((item) => item.id !== id);
    try { await persist(next, "Đã xóa danh mục chưa sử dụng."); }
    catch { /* persist already displays the error */ }
  }

  async function saveGroups(groups) {
    const next = { ...structuredClone(config), groups };
    // validateCategoryConfig also prevents deleting a group used by a category.
    await persist(next, "Đã cập nhật các nhóm chi tiêu.");
  }

  function CategoryRow({ cat }) {
    const groupName = config.groups.find((group) => group.id === cat.groupId)?.name;
    return <div className={`flex min-w-0 flex-wrap items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-[#f4f9f5] dark:hover:bg-slate-800/40 ${cat.hidden ? "opacity-65" : ""}`}>
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf7f0] text-lg dark:bg-emerald-950/30">{cat.icon || "•"}</span>
      <div className="min-w-0 flex-[1_1_130px]">
        <p className="truncate text-sm font-bold" title={cat.name}>{cat.name}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{cat.locked ? "Hệ thống tự động" : cat.hidden ? "Đang ẩn" : groupName || "Đang sử dụng"}</p>
      </div>
      <div className="ml-auto flex flex-wrap justify-end gap-2">
        {cat.locked ? <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:bg-slate-800">Được bảo vệ</span> : <>
          <button type="button" className={`${button} !min-h-9 !px-3`} disabled={saving} onClick={() => setEditor({ id: cat.id })}>Sửa</button>
          <button type="button" className={`${button} !min-h-9 !px-3`} disabled={saving} onClick={() => toggleCategory(cat)}>{cat.hidden ? "Hiện" : "Ẩn"}</button>
          <button type="button" className={`${button} !min-h-9 !px-3`} disabled={saving || usedCategoryIds.includes(cat.id)}
            title={blocked(cat.id) ? "Đã sử dụng: chỉ có thể ẩn" : "Xóa danh mục chưa dùng"} onClick={() => removeCategory(cat)}>Xóa</button>
        </>}
      </div>
    </div>;
  }

  return <section className={panel} aria-busy={saving}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-lg font-extrabold">Quản lý danh mục</h2>
        <p className={`mt-1 ${muted}`}>Tìm và chỉnh sửa đúng danh mục bạn cần. Mỗi thao tác lưu trực tiếp lên Firebase.</p></div>
      <div className="flex flex-wrap gap-2">
        {type === "expense" && <button type="button" className={button} disabled={saving} onClick={() => setGroupsOpen(true)}>Quản lý nhóm</button>}
        <button type="button" className={primary} disabled={saving} onClick={() => setEditor({ id: null })}>+ Thêm danh mục</button>
      </div>
    </div>
    <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-[#e2eee5] pb-4 dark:border-slate-800" role="group" aria-label="Loại danh mục">
      {[["expense", "Chi tiêu"], ["income", "Thu nhập"]].map(([id, label]) => <button key={id} type="button" aria-pressed={type === id}
        className={`min-h-10 rounded-xl px-4 text-sm font-bold transition-colors ${type === id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-slate-800"}`}
        onClick={() => { setType(id); setGroupFilter("all"); }}>{label}</button>)}
      <span className="ml-auto text-xs font-medium text-slate-500 dark:text-slate-400">{countActive} đang hiện · {countHidden} đã ẩn</span>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
      <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Tìm danh mục
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên danh mục…" className={`${input} !text-sm`}/>
      </label>
      {type === "expense" && <div className="grid min-w-0 gap-1.5"><label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nhóm chi tiêu</label>
        <SmartSelect label="Lọc theo nhóm chi tiêu" value={groupFilter} onChange={setGroupFilter}
          options={[{ value: "all", label: "Tất cả nhóm" }, ...config.groups.map((g) => ({ value: g.id, label: g.name }))]} />
      </div>}
      <label className="flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap text-sm font-semibold text-slate-600 dark:text-slate-300">
        <input type="checkbox" className="size-4 accent-emerald-600" checked={showHidden} onChange={(event) => setShowHidden(event.target.checked)}/> Hiện danh mục ẩn
      </label>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{message}</p>}
    <div className="mt-5 grid gap-4">
      {orderedGroups.length ? orderedGroups.map((group) => <div key={group.id} className="overflow-hidden rounded-2xl border border-[#e2eee5] dark:border-slate-800">
        <div className="flex items-center justify-between bg-[#f5faf6] px-4 py-3 dark:bg-slate-950/40">
          <h3 className="text-sm font-bold">{group.name}</h3><span className="text-xs text-slate-500 dark:text-slate-400">{items.filter((cat) => cat.groupId === group.id).length} danh mục</span>
        </div>
        <div className="divide-y divide-[#eef3ef] px-1 dark:divide-slate-800">
          {items.filter((cat) => cat.groupId === group.id).map((cat) => <CategoryRow key={cat.id} cat={cat}/>)}
        </div>
      </div>) : <div className="rounded-2xl border border-dashed border-[#d0e1d5] px-5 py-10 text-center dark:border-slate-700">
        <p className="font-semibold">Không có danh mục phù hợp</p><p className={`mt-2 ${muted}`}>Thử tìm tên khác, đổi bộ lọc hoặc bật hiển thị danh mục ẩn.</p>
      </div>}
    </div>
    <p className="mt-5 text-xs leading-5 text-slate-500 dark:text-slate-400">Danh mục đang có giao dịch hoặc hạn mức ngân sách sẽ không được xóa. Bạn có thể đổi tên, đổi nhóm hoặc ẩn mà không làm mất lịch sử; các danh mục tự động được bảo vệ.</p>

    {editor && <CategoryEditorDialog key={`${type}:${editor.id || "new"}`} item={editor.id ? config[type].find((cat) => cat.id === editor.id) : null}
      type={type} groups={config.groups} onSave={saveCategory} onClose={() => setEditor(null)}/>} 
    {groupsOpen && <GroupManagerDialog groups={config.groups} expense={config.expense} onSave={saveGroups} onClose={() => setGroupsOpen(false)} />}
  </section>;
}
