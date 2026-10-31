import { useState } from "react";
import { useCategories } from "../context/CategoryContext";
import { panel, input, primary, muted } from "../components/finance/ui";
import { isActual } from "../utils/finance";
import { formatMoney } from "../utils/money.js";

export default function BudgetPage({ budget, rows, onSave }) {
  const { expense: EXPENSE_CATEGORIES, getCategoryById } = useCategories();
  const [draft, setDraft] = useState(budget);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const amounts = {};
  rows
    .filter((tx) => tx.type === "expense" && isActual(tx))
    .forEach((tx) => {
      amounts[tx.category] = (amounts[tx.category] || 0) + tx.amount;
    });
  const [saving, setSaving] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const clean = {
      total: Number(draft.total || 0),
      categories: Object.fromEntries(
        Object.entries(draft.categories).map(([id, value]) => [
          id,
          Number(value || 0),
        ]),
      ),
    };
    try {
      if (
        ![clean.total, ...Object.values(clean.categories)].every(
          (n) => Number.isSafeInteger(n) && n >= 0,
        )
      )
        throw new Error("Hạn mức phải là số nguyên không âm.");
      setSaving(true);
      await onSave(clean);
      setFailed(false);
      setMessage("Đã lưu ngân sách tháng này.");
    } catch (reason) {
      setFailed(true);
      setMessage(reason.message || "Chưa lưu được ngân sách.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={submit} className="grid gap-6">
      <section className={panel}>
        <h2 className="font-bold">Hạn mức chung của tháng</h2>
        <p className={`mt-2 mb-4 ${muted}`}>
          Đơn vị: đồng. Để trống hoặc nhập 0 nếu chưa đặt hạn mức. Ngân sách
          không tạo thêm khoản chi.
        </p>
        <label className="grid max-w-md gap-2 text-sm font-semibold">
          Tổng ngân sách
          <input
            type="number"
            min="0"
            step="1"
            value={draft.total || ""}
            onChange={(e) => {
              setDraft({ ...draft, total: e.target.value });
              setMessage("");
            }}
            placeholder="VD: 15000000"
            className={input}
          />
        </label>
      </section>
      <section className={panel}>
        <h2 className="font-bold">Hạn mức theo danh mục</h2>
        <p className={`mt-2 mb-5 ${muted}`}>
          Các hạn mức này nằm trong ngân sách chung, không cộng thêm vào tổng.
          Chỉ cần đặt cho những mục bạn muốn kiểm soát.
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {EXPENSE_CATEGORIES.filter((c)=>!c.hidden && !c.locked).map((cat) => {
            const spent = amounts[cat.id] || 0;
            const cap = Number(draft.categories[cat.id]) || 0;
            return (
              <label
                key={cat.id}
                className="grid content-start gap-2 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <span className="text-sm font-semibold">
                  {getCategoryById(cat.id).name}
                </span>
                <input
                  aria-label={`Hạn mức ${getCategoryById(cat.id).name}`}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Chưa đặt"
                  value={draft.categories[cat.id] || ""}
                  onChange={(e) => {
                    setDraft({
                      ...draft,
                      categories: {
                        ...draft.categories,
                        [cat.id]: e.target.value,
                      },
                    });
                    setMessage("");
                  }}
                  className={input}
                />
                <span
                  className={`text-xs ${cap && spent > cap ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}
                >
                  Đã chi {formatMoney(spent)}
                  {cap > 0
                    ? ` · ${spent > cap ? "Vượt" : "Còn"} ${formatMoney(Math.abs(cap - spent))}`
                    : ""}
                </span>
              </label>
            );
          })}
        </div>
      </section>
      <div className="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <p
          role={failed ? "alert" : "status"}
          className={
            failed ? "text-sm text-rose-600 dark:text-rose-400" : muted
          }
        >
          {message || "Lưu để áp dụng hạn mức cho tháng đang chọn."}
        </p>
        <button type="submit" disabled={saving} className={primary}>
          {saving ? "Đang lưu…" : "Lưu ngân sách"}
        </button>
      </div>
    </form>
  );
}
