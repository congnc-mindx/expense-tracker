import { useEffect, useMemo, useRef, useState } from "react";
import SmartSelect from "../components/common/SmartSelect";
import { aggregatePeople, OCCASIONS } from "../utils/social";
import { filterSocialPeople } from "../utils/socialView";
import { formatMoney } from "../utils/money";
import { panel, input, muted } from "../components/finance/ui";
import SocialEntryModal from "../components/social/SocialEntryModal";
import SocialHistoryDialog from "../components/social/SocialHistoryDialog";
import SocialPeopleTable from "../components/social/SocialPeopleTable";
import useIncrementalList from "../components/common/useIncrementalList";
import LoadMoreButton from "../components/common/LoadMoreButton";

const sum = (rows, direction) => rows.filter((row) => row.direction === direction).reduce((total, row) => total + row.amount, 0);

export default function SocialLedgerPage({ store, addSignal = 0 }) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [occasionFilter, setOccasionFilter] = useState("");
  const [entryModal, setEntryModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const previousAddSignal = useRef(addSignal);
  useEffect(() => {
    if (addSignal !== previousAddSignal.current) setEntryModal({});
    previousAddSignal.current = addSignal;
  }, [addSignal]);

  const people = useMemo(() => aggregatePeople(store.rows), [store.rows]);
  const groups = useMemo(() => [...new Set(store.rows.map((entry) => entry.group || "Chưa phân nhóm"))].sort((a, b) => a.localeCompare(b, "vi")), [store.rows]);
  const filtered = useMemo(
    () => filterSocialPeople(people, { search, group: groupFilter, occasion: occasionFilter }),
    [people, search, groupFilter, occasionFilter],
  );
  const paging = useIncrementalList(filtered, [search,groupFilter,occasionFilter], 10);
  const visibleEntryCount = filtered.reduce((total, person) =>
    total + person.entries.filter((entry) => !occasionFilter || entry.occasion === occasionFilter).length, 0,
  );
  const activePerson = people.find((person) => person.key === selected);

  async function saveEntry(data, id) {
    if (store.loading || store.error) throw new Error(store.error || "Dữ liệu chưa tải xong.");
    const original = id ? store.rows.find((row) => row.id === id) : null;
    if (id && !original) throw new Error("Khoản ghi đã bị xóa.");
    await store.save(id || crypto.randomUUID(), { ...data, createdAt: original?.createdAt || Date.now(), updatedAt: Date.now() });
  }

  async function removeEntry(id) {
    if (store.loading || store.error) throw new Error(store.error || "Dữ liệu chưa tải xong.");
    await store.remove(id);
  }

  return (
    <div className="grid min-w-0 max-w-full gap-5 sm:gap-6">
      <p className={`${muted} -mt-2`}>Theo dõi các khoản gửi và nhận từ năm 2023 đến 2091. Chọn “Xem / Sửa” để quản lý từng lần phát sinh.</p>
      {store.error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{store.error}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Số người liên hệ", String(people.length), "text-slate-800 dark:text-slate-100"],
          ["Mình đã gửi", formatMoney(sum(store.rows, "given")), "text-rose-600 dark:text-rose-400"],
          ["Họ đã gửi", formatMoney(sum(store.rows, "received")), "text-emerald-700 dark:text-emerald-400"],
        ].map(([label, value, color]) => (
          <section key={label} className={panel}>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`mt-2 break-words text-2xl font-extrabold tabular-nums ${color}`}>{value}</p>
          </section>
        ))}
      </div>
      <section className={panel}>
        <div className="mb-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(170px,1fr)_minmax(170px,1fr)] lg:items-end">
          <label className="grid min-w-0 gap-1.5 text-sm font-semibold">Tìm người
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nhập tên người…" className={input} />
          </label>
          <label className="grid min-w-0 gap-1.5 text-sm font-semibold">Nhóm
            <SmartSelect label="Nhóm quan hệ" value={groupFilter} onChange={setGroupFilter} options={[{ value: "", label: "Tất cả nhóm" }, ...groups.map((group) => ({ value: group, label: group }))]} />
          </label>
          <label className="grid min-w-0 gap-1.5 text-sm font-semibold">Dịp
            <SmartSelect label="Dịp" value={occasionFilter} onChange={setOccasionFilter} options={[{ value: "", label: "Tất cả dịp" }, ...OCCASIONS.map((occasion) => ({ value: occasion.id, label: occasion.label }))]} />
          </label>
        </div>
        <p className={`mb-4 text-sm ${muted}`}>{filtered.length} người · {visibleEntryCount} khoản phù hợp</p>
        {store.loading ? <p className={muted}>Đang tải sổ mừng từ Firebase…</p> :
          <>
            <SocialPeopleTable people={paging.visible} occasion={occasionFilter} onSelect={setSelected} />
            <LoadMoreButton remaining={paging.remaining} batch={10} onClick={paging.loadMore} noun="người" />
          </>}
      </section>

      {activePerson && !entryModal && (
        <SocialHistoryDialog
          person={activePerson}
          onClose={() => setSelected(null)}
          onAdd={() => { setEntryModal({ seed: { personName: activePerson.name, group: activePerson.group } }); setSelected(null); }}
          onEdit={(entry) => { setEntryModal({ entry }); setSelected(null); }}
          onDelete={removeEntry}
        />
      )}
      {entryModal && (
        <SocialEntryModal
          entry={entryModal.entry}
          seed={entryModal.seed}
          groups={groups}
          people={people}
          onSave={saveEntry}
          onClose={() => setEntryModal(null)}
        />
      )}
    </div>
  );
}
