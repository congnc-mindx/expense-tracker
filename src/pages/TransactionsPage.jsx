import { useState } from "react";
import SmartSelect from "../components/common/SmartSelect";
import FinanceCards from "../components/finance/FinanceCards";
import TransactionList from "../components/finance/TransactionList";
import { panel, input, muted, button } from "../components/finance/ui";
import { useCategories } from "../context/CategoryContext";
import { isActual, normalize } from "../utils/finance";

export default function TransactionsPage({ type, rows, onEdit, onDelete, onSocialNavigate }) {
  const { expense: EXPENSE_CATEGORIES, income: INCOME_CATEGORIES, getCategoryById } = useCategories();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [limit, setLimit] = useState(30);
  const categories =
    type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const all = rows.filter((tx) => tx.type === type);
  const actual = all
    .filter((tx) => isActual(tx))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const planned = all
    .filter((tx) => !isActual(tx))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const filtered = all
    .filter(
      (tx) =>
        (category === "all" || tx.category === category) &&
        (status === "all" || (status === "actual") === isActual(tx)) &&
        normalize(
          `${tx.note} ${tx.source || ""} ${getCategoryById(tx.category).name}`,
        ).includes(normalize(query)),
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0),
    );
  return (
    <div className="grid gap-6">
      <FinanceCards
        items={[
          {
            label:
              type === "income" ? "Đã nhận trong tháng" : "Đã chi trong tháng",
            value: actual,
            color: type === "income" ? "green" : "red",
          },
          { label: "Dự kiến / chưa đến ngày", value: planned, color: "amber" },
          { label: "Số giao dịch", value: `${all.length} khoản` },
          { label: "Kết quả lọc", value: `${filtered.length} khoản` },
        ]}
      />
      {type === "income" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <strong>MindX · Chưa kết nối tự động.</strong> Bạn có thể ghi nguồn
          thu “MindX” thủ công. Chỉ khoản đã nhận và đã đến ngày mới tính vào
          thực thu.
        </div>
      )}
      <section className={panel}>
        <div className="mb-5 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
          <label className={`grid gap-2 ${muted}`}>
            Tìm giao dịch
            <input
              type="search"
              value={query}
              placeholder="Ghi chú, nguồn thu, danh mục…"
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(30);
              }}
              className={input}
            />
          </label>
          <label className={`grid gap-2 ${muted}`}>
            Danh mục
            <SmartSelect label="Danh mục" value={category} onChange={(v) => {setCategory(v);setLimit(30);}} options={[{value:"all",label:"Tất cả danh mục"}, ...categories.filter((cat)=>!cat.hidden || all.some((tx)=>tx.category===cat.id)).map((cat)=>({value:cat.id,label:getCategoryById(cat.id).name}))]}/>
          </label>
          <label className={`grid gap-2 ${muted}`}>
            Trạng thái
            <SmartSelect label="Trạng thái" value={status} onChange={(v)=>{setStatus(v);setLimit(30);}} options={[{value:"all",label:"Tất cả trạng thái"},{value:"actual",label:type === "income" ? "Đã nhận" : "Đã chi"},{value:"planned",label:"Dự kiến / chưa đến ngày"}]}/>
          </label>
        </div>
        <TransactionList
          rows={filtered.slice(0, limit)}
          onEdit={onEdit}
          onDelete={onDelete} onSocialNavigate={onSocialNavigate}
        />
        {filtered.length > limit && (
          <button
            type="button"
            className={`mt-4 ${button}`}
            onClick={() => setLimit(limit + 30)}
          >
            Xem thêm 30 giao dịch
          </button>
        )}
      </section>
    </div>
  );
}
