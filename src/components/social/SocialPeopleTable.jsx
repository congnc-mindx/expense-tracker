import { formatMoney } from "../../utils/money";
import { socialDirectionSummary } from "../../utils/socialView";
import { button, muted } from "../finance/ui";
import OverflowOccasions from "./OverflowOccasions";

function DirectionSummary({ entries, direction, occasion, onDetails }) {
  const summary = socialDirectionSummary(entries, direction, occasion);
  const incoming = direction === "received";
  return (
    <div className="min-w-0 space-y-1.5">
      <p className={`text-base font-extrabold tabular-nums ${summary.total ? (incoming ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400") : "text-slate-400 dark:text-slate-500"}`}>
        {summary.total ? formatMoney(summary.total) : "—"}
      </p>
      <OverflowOccasions occasions={summary.occasions} onDetails={onDetails} />
    </div>
  );
}

export default function SocialPeopleTable({ people, occasion, onSelect }) {
  if (!people.length) return <div className={`rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700 ${muted}`}>Không có khoản phù hợp với bộ lọc hiện tại.</div>;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Bấm tên hoặc “Xem / Sửa” để quản lý từng khoản</span>
        <span className="font-semibold">Đơn vị: đồng</span>
      </div>
      <div className="grid gap-3 xl:hidden">
        {people.map((person) => (
          <article key={person.key} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button type="button" className="text-left text-base font-bold text-emerald-700 hover:underline dark:text-emerald-400" onClick={() => onSelect(person.key)}>{person.name}</button>
                <p className={`mt-0.5 text-sm ${muted}`}>{person.group}</p>
              </div>
              <button type="button" className={`${button} shrink-0 !min-h-9 !px-3 !text-xs`} onClick={() => onSelect(person.key)}>Xem / Sửa</button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="min-w-0 rounded-xl bg-rose-50/70 p-3 dark:bg-rose-950/20">
                <p className="mb-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">Mình gửi</p>
                <DirectionSummary entries={person.entries} direction="given" occasion={occasion} onDetails={() => onSelect(person.key)} />
              </div>
              <div className="min-w-0 rounded-xl bg-emerald-50/70 p-3 dark:bg-emerald-950/20">
                <p className="mb-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">Họ gửi</p>
                <DirectionSummary entries={person.entries} direction="received" occasion={occasion} onDetails={() => onSelect(person.key)} />
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 xl:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col style={{ width: "15%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "31%" }} />
            <col style={{ width: "31%" }} />
            <col style={{ width: "11%" }} />
          </colgroup>
          <thead className="bg-[#f1f6f2] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <tr>
              <th scope="col" className="px-3 py-3 text-left font-bold">Người</th>
              <th scope="col" className="px-2 py-3 text-left font-bold">Nhóm</th>
              <th scope="col" className="border-l-2 border-rose-200 px-3 py-3 text-left font-bold text-rose-600 dark:border-rose-900/50 dark:text-rose-400">Mình gửi</th>
              <th scope="col" className="border-l-4 border-slate-300 px-3 py-3 text-left font-bold text-emerald-700 dark:border-slate-600 dark:text-emerald-400">Họ gửi</th>
              <th scope="col" className="px-2 py-3 text-center font-bold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.key} className="border-t border-slate-100 align-top transition-colors hover:bg-emerald-50/40 dark:border-slate-800 dark:hover:bg-slate-800/40">
                <th scope="row" className="break-words px-3 py-4 text-left">
                  <button type="button" className="text-left text-sm font-bold leading-6 text-emerald-700 hover:underline dark:text-emerald-400" onClick={() => onSelect(person.key)}>{person.name}</button>
                </th>
                <td className="break-words px-2 py-4 text-sm leading-6 text-slate-600 dark:text-slate-400">{person.group}</td>
                <td className="min-w-0 border-l-2 border-rose-100 px-3 py-3 dark:border-rose-900/30"><DirectionSummary entries={person.entries} direction="given" occasion={occasion} onDetails={() => onSelect(person.key)} /></td>
                <td className="border-l-4 border-slate-300 px-3 py-3 dark:border-slate-600"><DirectionSummary entries={person.entries} direction="received" occasion={occasion} onDetails={() => onSelect(person.key)} /></td>
                <td className="px-2 py-3 text-center">
                  <button type="button" className={`${button} !min-h-9 !px-2.5 !text-xs`} onClick={() => onSelect(person.key)} aria-label={`Xem và sửa các khoản của ${person.name}`}>Xem / Sửa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
