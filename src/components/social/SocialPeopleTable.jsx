import { formatMoney } from "../../utils/money";
import { formatThousands } from "../../utils/socialMoney";
import { OCCASIONS } from "../../utils/social";
import { button, muted } from "../finance/ui";

const FILTER_LABELS = { wedding: "Mừng cưới", funeral: "Phúng viếng", newborn: "Thăm con", hospital: "Thăm bệnh", other: "Khác" };
function filteredEntries(person, occasion, direction) {
  return person.entries.filter((entry) => (!occasion || entry.occasion === occasion) && (!direction || entry.direction === direction));
}
function amountFor(entries, direction, occasion) {
  return entries.filter((entry) => entry.direction === direction && entry.occasion === occasion).reduce((sum, entry) => sum + entry.amount, 0);
}
export default function SocialPeopleTable({ people, occasion, direction, onSelect }) {
  if (!people.length) return <div className={`rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700 ${muted}`}>Chưa có khoản phù hợp. Bấm “Ghi nhận khoản” để bắt đầu.</div>;
  return <>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400"><span>Bấm vào tên để xem từng lần phát sinh</span><span className="font-semibold">Đơn vị trong bảng: 1.000 đồng</span></div>
    <div className="grid gap-3 xl:hidden">
      {people.map((person) => {
        const entries = filteredEntries(person, occasion, direction);
        const given = entries.filter((item) => item.direction === "given").reduce((s, item) => s + item.amount, 0);
        const received = entries.filter((item) => item.direction === "received").reduce((s, item) => s + item.amount, 0);
        return <article key={person.key} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words font-bold">{person.name}</h3><p className={`mt-1 text-xs ${muted}`}>{person.group} · {entries.length} khoản</p></div><button type="button" className={`${button} shrink-0 !min-h-9 !px-3`} onClick={() => onSelect(person.key)}>Lịch sử</button></div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-rose-50 p-3 dark:bg-rose-950/20"><p className="text-xs text-slate-500">Mình gửi</p><p className="mt-1 font-bold tabular-nums text-rose-600 dark:text-rose-400">{formatMoney(given)}</p></div><div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/20"><p className="text-xs text-slate-500">Họ gửi</p><p className="mt-1 font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatMoney(received)}</p></div></div>
        </article>;
      })}
    </div>
    <div className="hidden min-w-0 max-w-full rounded-xl border border-slate-200 dark:border-slate-700 xl:block">
      <table className="w-full table-fixed border-collapse text-[11px] tabular-nums xl:text-xs">
        <colgroup><col style={{width:"11%"}}/><col style={{width:"13%"}}/>{Array.from({length:10},(_,i)=><col key={i} style={{width:"7.6%"}}/>)}</colgroup>
        <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
          <tr><th rowSpan="2" className="px-2 py-3 text-left">Người</th><th rowSpan="2" className="px-2 py-3 text-left">Nhóm</th><th colSpan={OCCASIONS.length} className="border-b border-r-4 border-r-slate-400/70 py-3 text-center font-bold text-rose-600 dark:border-b-slate-700">Mình gửi</th><th colSpan={OCCASIONS.length} className="border-b border-slate-300 py-3 text-center font-bold text-emerald-600 dark:border-slate-700">Họ gửi</th></tr>
          <tr>{["given", "received"].flatMap((dir) => OCCASIONS.map((item, i) => <th key={`${dir}-${item.id}`} title={FILTER_LABELS[item.id]} className={`break-words px-1 py-2 text-center text-[10px] leading-tight ${dir === "given" && i === OCCASIONS.length - 1 ? "border-r-4 border-r-slate-400/70" : ""}`}>{item.label}</th>))}</tr>
        </thead>
        <tbody>{people.map((person) => {
          const entries = filteredEntries(person, occasion, direction);
          return <tr key={person.key} className="border-t border-slate-100 transition-colors hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
            <th scope="row" className="break-words px-2 py-3 text-left"><button type="button" className="font-bold text-blue-700 hover:underline dark:text-blue-400" onClick={() => onSelect(person.key)} title="Xem lịch sử">{person.name}</button></th>
            <td className="break-words px-2 py-3 text-slate-500">{person.group}</td>
            {["given", "received"].flatMap((dir) => OCCASIONS.map((item, i) => {
              const total = amountFor(entries, dir, item.id);
              return <td key={`${dir}-${item.id}`} title={total ? formatMoney(total) : ""} className={`break-words px-1 py-3 text-center ${dir === "given" && i === OCCASIONS.length - 1 ? "border-r-4 border-r-slate-400/70" : ""} ${total ? "font-bold" : "text-slate-300 dark:text-slate-600"}`}>{total ? formatThousands(total) : "—"}</td>;
            }))}
          </tr>;
        })}</tbody>
      </table>
    </div>
  </>;
}
