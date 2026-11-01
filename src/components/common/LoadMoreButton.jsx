import { button } from "../finance/ui";
export default function LoadMoreButton({ remaining, batch = 10, onClick, noun = "mục" }) {
  if (!remaining) return null;
  return <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
    <button type="button" className={button} onClick={onClick}>Xem thêm {Math.min(batch,remaining)} {noun}</button>
    <span className="text-xs text-slate-500 dark:text-slate-400">Còn {remaining} {noun}</span>
  </div>;
}
