import { panel, muted } from "../finance/ui";
import { formatMoney } from "../../utils/money";

const palettes = ["#10a572", "#eaa52e", "#7387da", "#e47877", "#23a6b4", "#b387ce", "#9aab5d", "#718096"];
export function IncomeExpenseBars({ title, subtitle, rows, compact = false }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.income, r.expense]));
  return <section className={panel} aria-label={title}>
    <div className="flex flex-wrap items-start justify-between gap-2"><div>
      <h2 className="text-base font-extrabold sm:text-lg">{title}</h2>
      {subtitle && <p className={`mt-1 ${muted}`}>{subtitle}</p>}
    </div>
      <div className="flex gap-3 text-xs font-semibold"><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-emerald-500" />Thu</span><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-rose-500" />Chi</span></div>
    </div>
    <div className={`mt-5 grid min-w-0 items-end ${compact ? "h-44" : "h-52"} gap-1 border-b border-slate-200 dark:border-slate-700`} style={{ gridTemplateColumns: `repeat(${rows.length},minmax(0,1fr))` }}>
      {rows.map((r) => <div key={r.label} className="group flex h-full min-w-0 items-end justify-center gap-0.5 rounded-t-md px-0.5 hover:bg-emerald-500/5 sm:gap-1" title={`${r.label} · Thu ${formatMoney(r.income)} · Chi ${formatMoney(r.expense)}`}>
        <div className="min-w-[2px] max-w-7 flex-1 rounded-t-sm bg-emerald-500" style={{ height: `${r.income ? Math.max(2, 100 * r.income / max) : 0}%` }}/>
        <div className="min-w-[2px] max-w-7 flex-1 rounded-t-sm bg-rose-500" style={{ height: `${r.expense ? Math.max(2, 100 * r.expense / max) : 0}%` }}/>
      </div>)}
    </div>
    <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${rows.length},minmax(0,1fr))` }}>
      {rows.map((r) => <span key={r.label} className="truncate text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs">{r.label}</span>)}
    </div>
    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Cao nhất trên biểu đồ: {formatMoney(max)} · Di chuột vào cột để xem số tiền chính xác.</p>
  </section>;
}

export function CumulativeChart({ title, rows }) {
  const points = [{ balance: 0 }, ...rows];
  const values = points.map((p) => p.balance);
  let min = Math.min(0, ...values), max = Math.max(0, ...values);
  if (min === max) { min = -1; max = 1; }
  const x = (i) => 16 + i / Math.max(1, points.length - 1) * 568;
  const y = (v) => 174 - ((v - min) / (max - min)) * 150;
  const path = points.map((p, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(p.balance).toFixed(1)}`).join(" ");
  const zeroY = y(0);
  const closing = `${path} L ${x(points.length - 1)} 174 L 16 174 Z`;
  return <section className={panel}>
    <h2 className="text-base font-extrabold sm:text-lg">{title}</h2>
    <p className={`mt-1 ${muted}`}>Thu trừ chi cộng dồn theo thời gian, không phải số dư ngân hàng.</p>
    <svg role="img" aria-label={`${title}: từ ${formatMoney(0)} đến ${formatMoney(points.at(-1).balance)}`} viewBox="0 0 600 206" className="mt-4 block h-auto w-full" preserveAspectRatio="xMidYMid meet">
      <defs><linearGradient id="zwhis-balance-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10a572" stopOpacity=".24"/><stop offset="100%" stopColor="#10a572" stopOpacity="0"/></linearGradient></defs>
      <path d={`M16 ${zeroY.toFixed(1)} H584`} fill="none" stroke="currentColor" opacity=".18" strokeDasharray="5 6" />
      <path d={closing} fill="url(#zwhis-balance-fill)" />
      <path d={path} fill="none" stroke="#10a572" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(points.at(-1).balance)} r="4.5" fill="#10a572" stroke="white" strokeWidth="2" />
      <text x="16" y="196" fontSize="12" fill="currentColor" opacity=".6">Bắt đầu</text>
      <text x="584" y="196" textAnchor="end" fontSize="12" fill="currentColor" opacity=".6">Cuối kỳ</text>
    </svg>
    <p className="text-right text-sm font-bold tabular-nums">Chênh lệch cộng dồn: {formatMoney(points.at(-1).balance)}</p>
  </section>;
}

export function CategoryVisual({ title = "Cơ cấu chi tiêu", categories, getCategoryById, maxShown = 6 }) {
  const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
  const leading = categories.slice(0, maxShown);
  const remaining = categories.slice(maxShown).reduce((sum, cat) => sum + cat.amount, 0);
  const items = [...leading, ...(remaining > 0 ? [{ id: "__rest", amount: remaining, count: 0 }] : [])];
  let cursor = 0;
  const stops = items.map((cat, i) => {
    const end = cursor + cat.amount / (total || 1) * 100;
    const out = `${palettes[i % palettes.length]} ${cursor.toFixed(2)}% ${end.toFixed(2)}%`;
    cursor = end;
    return out;
  });
  return <section className={panel}>
    <h2 className="text-base font-extrabold sm:text-lg">{title}</h2>
    {total <= 0 ? <p className={`mt-5 ${muted}`}>Chưa có chi tiêu thực tế để phân tích.</p> : <div className="mt-5 grid items-center gap-5 sm:grid-cols-[144px_minmax(0,1fr)]">
      <div role="img" aria-label={`Biểu đồ tỷ trọng chi tiêu tổng ${formatMoney(total)}`} className="relative mx-auto grid size-36 place-items-center rounded-full p-4" style={{ background: `conic-gradient(${stops.join(",")})` }}>
        <div className="grid size-full content-center rounded-full bg-white text-center dark:bg-slate-900"><span className="text-xs text-slate-500">Tổng chi</span><span className="mt-1 break-words px-1 text-[10px] font-extrabold leading-4 tabular-nums" title={formatMoney(total)}>{formatMoney(total)}</span></div>
      </div>
      <div className="grid min-w-0 gap-3">{items.map((cat, i) => {
        const percent = Math.round(cat.amount / total * 100);
        const source = cat.id === "__rest" ? null : getCategoryById(cat.id);
        return <div key={cat.id} className="min-w-0">
          <div className="mb-1 flex min-w-0 justify-between gap-3 text-sm"><span className="min-w-0 truncate font-semibold"><span aria-hidden="true" className="mr-1.5" style={{ color: palettes[i % palettes.length] }}>●</span>{source ? `${source.icon || "•"} ${source.name}` : "Nhóm khác"}</span><span className="shrink-0 tabular-nums">{percent}%</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full" style={{ width: `${100 * cat.amount / total}%`, background: palettes[i % palettes.length] }}/></div>
          <p className="mt-0.5 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">{formatMoney(cat.amount)}</p>
        </div>;
      })}</div>
    </div>}
  </section>;
}

export function InsightStrip({ items }) {
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Điểm đáng chú ý">
    {items.map((item) => <div key={item.label} className="rounded-2xl border border-[#dce9df] bg-[#f5faf7] px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.label}</p>
      <p className="mt-1 break-words text-base font-extrabold tabular-nums">{item.value}</p>
      {item.note && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.note}</p>}
    </div>)}
  </section>;
}
