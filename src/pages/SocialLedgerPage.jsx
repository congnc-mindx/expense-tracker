import { useEffect, useMemo, useRef, useState } from "react";
import SmartSelect from "../components/common/SmartSelect";
import { aggregatePeople, OCCASIONS, socialName } from "../utils/social";
import { normalize } from "../utils/finance";
import { formatMoney } from "../utils/money";
import { panel, button, primary, input, muted } from "../components/finance/ui";
import SocialEntryModal from "../components/social/SocialEntryModal";
import SocialPeopleTable from "../components/social/SocialPeopleTable";

const sum = (rows, direction) => rows.filter((r)=>r.direction === direction).reduce((total,r)=>total+r.amount,0);
export default function SocialLedgerPage({ store, addSignal = 0 }) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [occasionFilter, setOccasionFilter] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState("");
  // Respond only to a new toolbar action, not to remounting the social page.
  const previousAddSignal = useRef(addSignal);
  useEffect(() => {
    if (addSignal !== previousAddSignal.current) setModal({});
    previousAddSignal.current = addSignal;
  }, [addSignal]);
  const people = useMemo(() => aggregatePeople(store.rows), [store.rows]);
  const groups = useMemo(() => [...new Set(store.rows.map((e)=>e.group || "Chưa phân nhóm"))].sort((a,b)=>a.localeCompare(b,"vi")), [store.rows]);
  const filtered = useMemo(() => people.filter((p) => {
    const items = p.entries.filter((e) => (!occasionFilter || e.occasion === occasionFilter) && (!directionFilter || e.direction === directionFilter));
    return (!groupFilter || p.group === groupFilter) && normalize(p.name).includes(normalize(search)) && items.length > 0;
  }), [people, search, groupFilter, occasionFilter, directionFilter]);
  const visibleEntries = filtered.flatMap((p)=>p.entries.filter((e)=>(!occasionFilter || e.occasion===occasionFilter) && (!directionFilter || e.direction===directionFilter)));
  const activePerson = people.find((p)=>p.key===selected);
  async function saveEntry(data, id) {
    if (store.loading || store.error) throw new Error(store.error || "Dữ liệu chưa tải xong.");
    const original = id ? store.rows.find((r)=>r.id===id) : null;
    if (id && !original) throw new Error("Khoản ghi đã bị xóa.");
    await store.save(id || crypto.randomUUID(), { ...data, createdAt: original?.createdAt || Date.now(), updatedAt: Date.now() });
  }
  async function removeEntry(id) {
    setError("");
    try { await store.remove(id); setPendingDelete(null); }
    catch (e) { setError(e.message || "Không xóa được khoản ghi nhận."); }
  }
  return <div className="grid min-w-0 max-w-full gap-6">
    <p className={`${muted} -mt-2`}>Lưu từng lần gửi và nhận, từ năm 2023 đến 2091. Chọn tên để xem lịch sử.</p>
    {(error || store.error) && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error || store.error}</p>}
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        ["Số người liên hệ", String(people.length), "text-slate-800 dark:text-slate-100"],
        ["Mình đã gửi", formatMoney(sum(store.rows, "given")), "text-rose-600 dark:text-rose-400"],
        ["Họ đã gửi", formatMoney(sum(store.rows, "received")), "text-emerald-600 dark:text-emerald-400"],
      ].map(([label, value, color])=><section key={label} className={panel}><p className="text-xs font-semibold text-slate-500">{label}</p><p className={`mt-2 text-2xl font-extrabold tabular-nums ${color}`}>{value}</p></section>)}
    </div>
    <section className={panel}>
      <div className="mb-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(190px,2fr)_repeat(3,minmax(130px,1fr))] xl:items-end">
        <label className="grid flex-1 gap-1 text-xs font-semibold">Tìm người
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Nhập tên, không phân biệt dấu…" className={input}/>
        </label>
        <label className="grid gap-1 text-xs font-semibold">Nhóm
          <SmartSelect label="Nhóm quan hệ" value={groupFilter} onChange={setGroupFilter} options={[{value:"",label:"Tất cả nhóm"},...groups.map((g)=>({value:g,label:g}))]}/>
        </label>
        <label className="grid gap-1 text-xs font-semibold">Dịp
          <SmartSelect label="Dịp" value={occasionFilter} onChange={setOccasionFilter} options={[{value:"",label:"Tất cả dịp"},...OCCASIONS.map((o)=>({value:o.id,label:o.label}))]}/>
        </label>
        <label className="grid gap-1 text-xs font-semibold">Chiều
          <SmartSelect label="Chiều" value={directionFilter} onChange={setDirectionFilter} options={[{value:"",label:"Hai chiều"},{value:"given",label:"Mình gửi"},{value:"received",label:"Họ gửi"}]}/>
        </label>
      </div>
      <p className={`mb-4 text-xs ${muted}`}>{filtered.length} người · {visibleEntries.length} khoản phù hợp. Bấm vào tên để xem lịch sử chi tiết.</p>
      {store.loading ? <p className={muted}>Đang tải sổ mừng từ Firebase…</p> :
        <SocialPeopleTable people={filtered} occasion={occasionFilter} direction={directionFilter} onSelect={setSelected}/>}
    </section>
    {activePerson && <section className={panel}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-extrabold">{activePerson.name} <span className="text-sm font-normal text-slate-500">· {activePerson.group}</span></h3><p className={muted}>Lịch sử dài hạn · Mình gửi {formatMoney(activePerson.given)} · Họ gửi {formatMoney(activePerson.received)}</p></div>
        <div className="flex gap-2"><button type="button" className={primary} onClick={()=>setModal({seed:{ personName: activePerson.name, group: activePerson.group }})}>＋ Thêm lần mới</button><button type="button" className={button} onClick={()=>setSelected(null)}>Đóng</button></div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">{[...activePerson.entries].sort((a,b)=>b.date.localeCompare(a.date)).map((e)=><article key={e.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
        <div className="min-w-0 flex-1"><p className="font-semibold">{socialName(e.occasion)} · <span className={e.direction === "given" ? "text-rose-600" : "text-emerald-600"}>{e.direction === "given" ? "Mình gửi" : "Họ gửi"}</span></p><p className={`mt-1 ${muted}`}>{e.date.split("-").reverse().join("/")}{e.note ? ` · ${e.note}` : ""}</p></div>
        <span className="font-bold tabular-nums">{formatMoney(e.amount)}</span>
        <button type="button" className={button} onClick={()=>setModal({entry:e})}>Sửa</button>
        <button type="button" className={button} onClick={()=>setPendingDelete(e.id)}>Xóa</button>
        {pendingDelete === e.id && <div className="flex w-full justify-end gap-2"><span className="text-xs">Xóa khoản này?</span><button type="button" className={button} onClick={()=>removeEntry(e.id)}>Xác nhận</button><button type="button" className={button} onClick={()=>setPendingDelete(null)}>Hủy</button></div>}
      </article>)}</div>
    </section>}
    {modal && <SocialEntryModal entry={modal.entry} seed={modal.seed} groups={groups} people={people} onSave={saveEntry} onClose={()=>setModal(null)}/>}
  </div>;
}
