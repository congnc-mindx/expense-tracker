import { useState } from "react";
import SmartSelect from "../components/common/SmartSelect";
import FinanceCards from "../components/finance/FinanceCards";
import TransactionList from "../components/finance/TransactionList";
import { panel, input, muted, button } from "../components/finance/ui";
import { useCategories } from "../context/CategoryContext";
import { isActual, normalize } from "../utils/finance";
import useIncrementalList from "../components/common/useIncrementalList";
import LoadMoreButton from "../components/common/LoadMoreButton";

export default function TransactionsPage({ type, rows, onEdit, onDelete, onSocialNavigate, onRecurringPayment }) {
  const { expense: EXPENSE_CATEGORIES, income: INCOME_CATEGORIES, getCategoryById } = useCategories();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
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
    .sort((a,b) => {
      const plannedA = !isActual(a);
      const plannedB = !isActual(b);
      if (plannedA !== plannedB) return plannedA ? 1 : -1;
      // Paid: newest first. Upcoming: nearest due date first.
      return plannedA ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date) || (b.createdAt || 0)-(a.createdAt || 0);
    });
  const paging = useIncrementalList(filtered, [type, query, category, status], 10);
  return (
    <div className="grid gap-6">
      <FinanceCards compact columns={3}
        items={[
          {
            label:
              type === "income" ? "Đã nhận trong tháng" : "Đã chi trong tháng",
            value: actual,
            color: type === "income" ? "green" : "red",
          },
          { label: "Dự kiến", value: planned, color: "amber" },
          { label: "Số khoản trong tháng", value: `${all.length} khoản` },
        ]}
      />
      <section className={panel}>
        <div className="mb-5 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
          <label className={`grid gap-2 ${muted}`}>
            Tìm giao dịch
            <input
              type="search"
              value={query}
              placeholder="Ghi chú, danh mục…"
              onChange={(e) => setQuery(e.target.value)}
              className={input}
            />
          </label>
          <label className={`grid gap-2 ${muted}`}>
            Danh mục
            <SmartSelect label="Danh mục" value={category} onChange={(v) => {setCategory(v);}} options={[{value:"all",label:"Tất cả danh mục"}, ...categories.filter((cat)=>!cat.hidden || all.some((tx)=>tx.category===cat.id)).map((cat)=>({value:cat.id,label:getCategoryById(cat.id).name}))]}/>
          </label>
          <label className={`grid gap-2 ${muted}`}>
            Trạng thái
            <SmartSelect label="Trạng thái" value={status} onChange={(v)=>{setStatus(v);}} options={[{value:"all",label:"Tất cả trạng thái"},{value:"actual",label:type === "income" ? "Đã nhận" : "Đã chi"},{value:"planned",label:"Dự kiến / chưa đến ngày"}]}/>
          </label>
        </div>
        <TransactionList
          rows={paging.visible}
          onEdit={onEdit}
          onDelete={onDelete} onSocialNavigate={onSocialNavigate} onRecurringPayment={onRecurringPayment}
        />
        <LoadMoreButton remaining={paging.remaining} batch={10} onClick={paging.loadMore} noun="giao dịch" />
      </section>
    </div>
  );
}
