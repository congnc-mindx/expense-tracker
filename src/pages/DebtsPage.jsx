import { useEffect, useMemo, useRef, useState } from "react";
import { panel, input, muted } from "../components/finance/ui";
import SmartSelect from "../components/common/SmartSelect";
import LoadMoreButton from "../components/common/LoadMoreButton";
import useIncrementalList from "../components/common/useIncrementalList";
import { formatMoney } from "../utils/money";
import { debtOverview, debtStatus, filterDebts, outstandingDebtAmount, paidDebtAmount, debtPayments } from "../utils/debts";
import useDebts from "../hooks/useDebts";
import DebtFormDialog from "../components/debts/DebtFormDialog";
import DebtDetailsDialog from "../components/debts/DebtDetailsDialog";

const statusLabels = {
  paid: "Đã tất toán", overdue: "Quá hạn", dueSoon: "Sắp đến hạn", active: "Đang theo dõi", undated: "Không có hạn trả",
};
const statusColors = {
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  dueSoon: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  active: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  undated: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};
const displayDate = (date) => date ? date.split("-").reverse().join("/") : "—";
const monthLabel = (value) => `Tháng ${Number(value.slice(5))}/${value.slice(0,4)}`;

function debtMonthSummary(rows, month) {
  return rows.reduce((summary, debt) => {
    if (debt.date?.startsWith(month)) {
      if (debt.direction === "payable") summary.createdPayable += debt.amount;
      else summary.createdReceivable += debt.amount;
    }
    for (const payment of debtPayments(debt)) {
      if (!payment.date?.startsWith(month)) continue;
      if (debt.direction === "payable") summary.paidInMonth += payment.amount;
      else summary.collectedInMonth += payment.amount;
    }
    return summary;
  }, { createdPayable: 0, createdReceivable: 0, paidInMonth: 0, collectedInMonth: 0 });
}

function Stat({ title, value, subtitle, tone }) {
  return <section className={`${panel} !p-3 sm:!p-4`}>
    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</p>
    <p className={`mt-2 break-words text-lg font-extrabold tabular-nums sm:text-xl ${tone}`}>{value}</p>
    {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
  </section>;
}

function DebtCard({ debt, today, onOpen }) {
  const remaining = outstandingDebtAmount(debt);
  const paid = paidDebtAmount(debt);
  const percent = Math.min(100, Math.round((paid / debt.amount) * 100));
  const status = debtStatus(debt, today);
  const receivable = debt.direction === "receivable";
  return <button type="button" onClick={() => onOpen(debt.id)}
    aria-label={`Xem khoản ${receivable ? "người khác nợ tôi" : "tôi đang nợ"} của ${debt.person}, còn ${formatMoney(remaining)}`}
    className={`${panel} group flex w-full min-w-0 flex-col gap-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:hover:border-emerald-600`}
  >
    <div className="flex w-full min-w-0 items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-xl text-xl font-bold ${receivable ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>{receivable ? "↙" : "↗"}</span>
        <div className="min-w-0">
          <p className="break-words text-base font-extrabold sm:text-lg">{debt.person}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{receivable ? "Người khác nợ tôi" : "Tôi đang nợ"}</p>
        </div>
      </div>
      <span className={`max-w-32 shrink-0 rounded-full px-2.5 py-1 text-center text-[11px] font-bold ${statusColors[status]}`}>{statusLabels[status]}</span>
    </div>
    <div className="w-full rounded-xl bg-[#f6f9f7] p-3 dark:bg-slate-950/45">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400"><span>Còn phải {receivable ? "thu" : "trả"}</span><span>Gốc: {formatMoney(debt.amount)}</span></div>
      <p className={`mt-1 break-words text-xl font-extrabold tabular-nums sm:text-2xl ${remaining ? (receivable ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400") : "text-slate-700 dark:text-slate-200"}`}>{formatMoney(remaining)}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"><span>Đã thanh toán</span><span className="font-semibold tabular-nums">{percent}%</span></div>
      <div role="progressbar" aria-label={`Tỷ lệ đã thanh toán của ${debt.person}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }}/>
      </div>
    </div>
    <div className="mt-auto flex w-full items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
      <span className={status === "overdue" ? "font-bold text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}>{debt.dueDate ? `Hẹn trả: ${displayDate(debt.dueDate)}` : "Chưa đặt ngày hẹn trả"}</span>
      <span className="shrink-0 font-bold text-emerald-700 group-hover:underline dark:text-emerald-400">Xem chi tiết ›</span>
    </div>
  </button>;
}

export default function DebtsPage({ uid, today, month, addSignal = 0 }) {
  const store = useDebts(uid);
  const [direction, setDirection] = useState("all");
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const prevSignal = useRef(addSignal);
  useEffect(() => {
    if (addSignal !== prevSignal.current) { setSelectedId(null); setForm({ initialDirection: "payable" }); }
    prevSignal.current = addSignal;
  }, [addSignal]);
  const summary = useMemo(() => debtOverview(store.rows, today), [store.rows, today]);
  const inMonth = useMemo(() => debtMonthSummary(store.rows, month), [store.rows, month]);
  const filtered = useMemo(() => filterDebts(store.rows, { direction, status, query: search, today }), [store.rows, direction, status, search, today]);
  const paging = useIncrementalList(filtered, [direction, status, search], 10);
  const selected = store.rows.find((row) => row.id === selectedId);

  function edit(debt) {
    setSelectedId(null);
    setForm({ debt });
  }

  return <div className="grid min-w-0 gap-4 sm:gap-5">
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Stat title="Tôi còn nợ" value={formatMoney(summary.payable)} subtitle="Số phải trả" tone="text-amber-700 dark:text-amber-400" />
      <Stat title="Người khác nợ tôi" value={formatMoney(summary.receivable)} subtitle="Số chờ thu hồi" tone="text-emerald-700 dark:text-emerald-400" />
      <Stat title="Quá hạn" value={`${summary.overdueCount} khoản`} subtitle={formatMoney(summary.overdueAmount)} tone={summary.overdueCount ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-100"} />
      <Stat title="Sắp đến hạn" value={`${summary.dueSoonCount} khoản`} subtitle="Trong 7 ngày tới" tone="text-slate-800 dark:text-slate-100" />
    </div>

    <section className={`${panel} !p-3 sm:!p-4`}>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-[#f6f9f7] px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
        <span className="rounded-full bg-white px-2.5 py-1 dark:bg-slate-900">Kỳ đang xem: {monthLabel(month)}</span>
        <span>Phát sinh tôi nợ: <strong className="text-amber-700 dark:text-amber-400">{formatMoney(inMonth.createdPayable)}</strong></span>
        <span>Phát sinh nợ tôi: <strong className="text-emerald-700 dark:text-emerald-400">{formatMoney(inMonth.createdReceivable)}</strong></span>
        <span>Đã trả / đã thu: <strong>{formatMoney(inMonth.paidInMonth + inMonth.collectedInMonth)}</strong></span>
      </div>
      <div role="group" aria-label="Chiều khoản nợ" className="grid grid-cols-3 gap-2">
        {[
          { value: "all", label: "Tất cả" },
          { value: "payable", label: "Tôi đang nợ" },
          { value: "receivable", label: "Nợ tôi" },
        ].map((option) => <button key={option.value} type="button" aria-pressed={direction === option.value} onClick={() => setDirection(option.value)}
          className={`min-h-11 rounded-xl px-2 py-2 text-xs font-bold transition-colors sm:px-3 sm:text-sm ${direction === option.value ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"}`}>{option.label}</button>)}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">Tìm theo người hoặc ghi chú
          <input type="search" className={input} placeholder="Tìm khoản nợ…" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">Trạng thái
          <SmartSelect label="Lọc trạng thái nợ" value={status} onChange={setStatus} options={[
            { value: "active", label: "Chưa tất toán" }, { value: "overdue", label: "Đã quá hạn" },
            { value: "paid", label: "Đã tất toán" }, { value: "all", label: "Tất cả trạng thái" },
          ]}/>
        </label>
      </div>
      <p className={`mt-3 text-xs ${muted}`}>{filtered.length} khoản phù hợp · Nhấn vào thẻ để xem lịch sử trả nợ, sửa hoặc xóa.</p>
    </section>

    {store.error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{store.error}</p>}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
    {store.loading ? <div className={`${panel} text-center text-sm text-slate-500`}>Đang tải Sổ nợ từ Firebase…</div> : filtered.length ? <>
      <div className="grid min-w-0 items-stretch gap-3 lg:grid-cols-2">
        {paging.visible.map((debt) => <DebtCard key={debt.id} debt={debt} today={today} onOpen={(id) => { setError(""); setSelectedId(id); }} />)}
      </div>
      <LoadMoreButton remaining={paging.remaining} batch={10} onClick={paging.loadMore} noun="khoản" />
    </> : <div className={`${panel} py-12 text-center`}>
      <p className="text-base font-bold">{store.rows.length ? "Không tìm thấy khoản nợ phù hợp" : "Chưa có khoản nợ nào"}</p>
      <p className={`mt-2 ${muted}`}>{store.rows.length ? "Thử thay đổi bộ lọc hoặc từ khóa." : "Bắt đầu bằng nút + Ghi khoản nợ ở phía trên."}</p>
    </div>}

    {selected && !form && <DebtDetailsDialog debt={selected} onClose={() => setSelectedId(null)} onEdit={() => edit(selected)} onDelete={store.remove}
      onPayment={store.addPayment} onRemovePayment={store.removePayment} />}
    {form && <DebtFormDialog debt={form.debt} initialDirection={form.initialDirection} onSave={store.save} onClose={() => setForm(null)} />}
  </div>;
}
