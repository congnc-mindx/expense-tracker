import { useState } from "react";
import { useCategories } from "../../context/CategoryContext";
import { formatMoney } from "../../utils/money.js";
import { isActual } from "../../utils/finance";
import { button, muted } from "./ui";

export default function TransactionList({
  rows,
  onEdit,
  onDelete,
  onSocialNavigate,
}) {
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
                {tx.note || category.name}
              </p>
              <p className={`mt-1 break-words text-xs ${muted}`}>
                {category.name}
                {tx.source ? ` · ${tx.source}` : ""} ·{" "}
                {tx.date.split("-").reverse().join("/")}
              </p>
              {!isActual(tx) && (
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {tx.status === "planned" ? "Dự kiến" : "Ngày tương lai"}
                </span>
              )}
            </div>
            <p
              className={`max-w-full break-words text-right text-sm font-bold tabular-nums ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
            >
              {tx.type === "income" ? "+" : "−"}
              {formatMoney(tx.amount)}
            </p>
            {(onEdit || tx.origin === "social") && (
              <div className="flex w-full justify-end gap-2 sm:w-auto">
                {tx.origin === "social" ? (
                  <button
                    type="button"
                    className={button}
                    onClick={onSocialNavigate}
                  >
                    Xem trong sổ
                  </button>
                ) : pending === tx.id ? (
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
