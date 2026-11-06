import { formatMoney } from "../../utils/money";
import { socialDirectionSummary } from "../../utils/socialView";
import { muted } from "../finance/ui";
import OverflowOccasions from "./OverflowOccasions";

function DirectionSummary({ entries, direction, occasion }) {
  const summary = socialDirectionSummary(entries, direction, occasion);
  const incoming = direction === "received";
  return (
    <div className="min-w-0 space-y-1.5">
      <p className={`text-base font-extrabold tabular-nums ${summary.total ? (incoming ? "text-emerald-700 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400") : "text-slate-400 dark:text-slate-500"}`}>
        {summary.total ? formatMoney(summary.total) : "—"}
      </p>
      <OverflowOccasions occasions={summary.occasions} />
    </div>
  );
}

function activateSelect(event, onSelect, key) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onSelect(key);
  }
}

export default function SocialPeopleTable({ people, occasion, onSelect }) {
  if (!people.length) return <div className={`rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700 ${muted}`}>Không có khoản phù hợp với bộ lọc hiện tại.</div>;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Bấm vào một dòng để xem và chỉnh toàn bộ lịch sử của người đó</span>
        <span className="font-semibold">Đơn vị: đồng</span>
      </div>
      <div className="grid gap-3 xl:hidden">
        {people.map((person) => (
          <article
            key={person.key}
            role="button"
            tabIndex={0}
            aria-label={`Xem lịch sử mừng và thăm hỏi của ${person.name}`}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700 dark:hover:bg-slate-800/60"
            onClick={() => onSelect(person.key)}
            onKeyDown={(event) => activateSelect(event, onSelect, person.key)}
          >
            <div className="min-w-0">
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">{person.name}</p>
              <p className={`mt-0.5 text-sm ${muted}`}>{person.group}</p>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="min-w-0 rounded-xl bg-amber-50/70 p-3 dark:bg-amber-950/20">
                <p className="mb-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">Mình gửi</p>
                <DirectionSummary entries={person.entries} direction="given" occasion={occasion} />
              </div>
              <div className="min-w-0 rounded-xl bg-emerald-50/70 p-3 dark:bg-emerald-950/20">
                <p className="mb-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">Họ gửi</p>
                <DirectionSummary entries={person.entries} direction="received" occasion={occasion} />
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 xl:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col style={{ width: "17%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "35%" }} />
            <col style={{ width: "35%" }} />
          </colgroup>
          <thead className="bg-[#f1f6f2] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <tr>
              <th scope="col" className="px-3 py-3 text-left font-bold">Người</th>
              <th scope="col" className="px-2 py-3 text-left font-bold">Nhóm</th>
              <th scope="col" className="border-l-2 border-amber-200 px-3 py-3 text-left font-bold text-amber-700 dark:border-amber-900/50 dark:text-amber-400">Mình gửi</th>
              <th scope="col" className="border-l-4 border-slate-300 px-3 py-3 text-left font-bold text-emerald-700 dark:border-slate-600 dark:text-emerald-400">Họ gửi</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr
                key={person.key}
                tabIndex={0}
                aria-label={`Xem lịch sử mừng và thăm hỏi của ${person.name}`}
                className="cursor-pointer border-t border-slate-100 align-top transition-colors hover:bg-emerald-50/40 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:border-slate-800 dark:hover:bg-slate-800/40"
                onClick={() => onSelect(person.key)}
                onKeyDown={(event) => activateSelect(event, onSelect, person.key)}
              >
                <th scope="row" className="break-words px-3 py-4 text-left text-sm font-bold leading-6 text-emerald-700 dark:text-emerald-400">
                  {person.name}
                </th>
                <td className="break-words px-2 py-4 text-sm leading-6 text-slate-600 dark:text-slate-400">{person.group}</td>
                <td className="min-w-0 border-l-2 border-amber-100 px-3 py-3 dark:border-amber-900/30"><DirectionSummary entries={person.entries} direction="given" occasion={occasion} /></td>
                <td className="border-l-4 border-slate-300 px-3 py-3 dark:border-slate-600"><DirectionSummary entries={person.entries} direction="received" occasion={occasion} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
