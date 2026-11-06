import { useLayoutEffect, useRef, useState } from "react";
import { formatMoney } from "../../utils/money";

const chip = "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white/70 px-2 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

/** Shows as many event chips as truly fit, reserving space for a +N shortcut. */
export default function OverflowOccasions({ occasions }) {
  const container = useRef(null);
  const measure = useRef(null);
  const [count, setCount] = useState(0);

  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    function recompute() {
      const available = element.clientWidth;
      const widths = Array.from(measure.current?.children || [], (node) => node.getBoundingClientRect().width);
      if (!available || widths.length !== occasions.length) return;
      const gap = 6;
      const fullWidth = widths.reduce((total, width) => total + width, 0) + Math.max(0, widths.length - 1) * gap;
      if (fullWidth <= available + 1) { setCount(occasions.length); return; }
      const reserve = 42;
      let occupied = 0;
      let visible = 0;
      for (let index = 0; index < widths.length; index++) {
        const next = occupied + widths[index] + gap;
        if (next + reserve > available) break;
        occupied = next;
        visible++;
      }
      setCount(visible);
    }
    recompute();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(recompute) : null;
    observer?.observe(element);
    return () => observer?.disconnect();
  }, [occasions]);

  if (!occasions.length) return null;
  const hidden = Math.max(0, occasions.length - count);
  return (
    <div ref={container} className="relative w-full min-w-0 overflow-hidden">
      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
        {occasions.slice(0, count).map((item) => (
          <span key={item.id} className={chip} title={`${item.label}: ${formatMoney(item.amount)}`}>
            <span>{item.label}</span><strong className="font-bold tabular-nums text-slate-800 dark:text-slate-100">{formatMoney(item.amount)}</strong>
          </span>
        ))}
        {hidden > 0 && <span className={`${chip} !font-bold text-slate-500 dark:text-slate-300`}>+{hidden}</span>}
      </div>
      <div aria-hidden="true" ref={measure} className="pointer-events-none invisible absolute left-0 top-0 flex w-max gap-1.5 whitespace-nowrap">
        {occasions.map((item) => <span key={item.id} className={chip}><span>{item.label}</span><strong className="font-bold tabular-nums">{formatMoney(item.amount)}</strong></span>)}
      </div>
    </div>
  );
}
