import { useState } from "react";
import { useCategories } from "../../context/CategoryContext";
import { formatMoney } from "../../utils/money.js";
import { isActual, localDate } from "../../utils/finance";
import { button, muted } from "./ui";

export default function TransactionList({ rows, onEdit, onDelete, onSocialNavigate, onRecurringPayment }) {
  const { getCategoryById } = useCategories();
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");
  async function remove(id) {
    try {
      await onDelete(id);
      setPending(null);
      setError("");
    } catch (reason) {
      setError(reason.message || "Chưa xóa được giao dịch.");
    }
  }
  const [paying,setPaying]=useState(null);
  async function pay(tx) {
    if (!onRecurringPayment || paying) return;
    setPaying(tx.id);setError("");
    try { await onRecurringPayment(tx); }
    catch(reason) { setError(reason.message || "Không ghi được khoản định kỳ."); }
    finally { setPaying(null); }
  }
  if (!rows.length)
    return (
      <p className={`py-10 text-center ${muted}`}>Chưa có giao dịch phù hợp.</p>
    );
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {error && (
        <p role="alert" className="py-3 text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
      {rows.map((tx) => {
        const category = getCategoryById(tx.category);
        return (
          <article
            key={tx.id}
            className="flex flex-wrap items-center gap-3 py-4"
          >
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800"
            >
              {category.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold">
                {tx.virtual ? (tx.title || tx.note || category.name) : (tx.note || category.name)}
              </p>
              <p className={`mt-1 break-words text-xs ${muted}`}>
                {category.name}
                {tx.source ? ` · ${tx.source}` : ""} ·{" "}
                {tx.date.split("-").reverse().join("/")}
              </p>
              {tx.virtual && <span className="mr-2 text-xs text-emerald-700 dark:text-emerald-400">Lặp hằng tháng</span>}
              {!isActual(tx) && (
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Dự kiến
                </span>
              )}
            </div>
            <p
              className={`max-w-full break-words text-right text-sm font-bold tabular-nums ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
            >
              {tx.type === "income" ? "+" : "−"}
              {formatMoney(tx.amount)}
            </p>
            {tx.virtual ? <div className="flex w-full justify-end sm:w-auto">
              <button type="button" className={`${button} !min-h-9 !text-xs`} disabled={paying===tx.id || tx.date>localDate() || !onRecurringPayment} onClick={()=>pay(tx)}
                title={tx.date>localDate()?"Chỉ ghi nhận khi đến hạn":"Ghi khoản thu/chi thực tế vào Firebase"}>
                {paying===tx.id ? "Đang lưu…" : tx.date>localDate() ? "Chưa đến hạn" : tx.type === "income" ? "Ghi đã nhận" : "Ghi đã chi"}
              </button>
            </div> : (onEdit || tx.origin === "social") && (
              <div className="flex w-full justify-end gap-2 sm:w-auto">
                {tx.origin === "social" ? <button type="button" className={button} onClick={onSocialNavigate}>Xem trong sổ</button> : pending === tx.id ? (
                  <>
                    <span className="self-center text-xs">Xóa khoản này?</span>
                    <button
                      type="button"
                      className={button}
                      onClick={() => remove(tx.id)}
                    >
                      Xác nhận
                    </button>
                    <button
                      type="button"
                      className={button}
                      onClick={() => setPending(null)}
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={button}
                      aria-label={`Sửa ${tx.note || category.name}`}
                      onClick={() => onEdit(tx)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className={button}
                      aria-label={`Xóa ${tx.note || category.name}`}
                      onClick={() => {
                        setPending(tx.id);
                        setError("");
                      }}
                    >
                      Xóa
                    </button>
                  </>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
