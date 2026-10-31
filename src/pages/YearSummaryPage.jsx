import { useState } from "react";
import useYearPlan from "../hooks/useYearPlan";
import { buildYearSummary } from "../utils/yearSummary";
import { formatMoney } from "../utils/money.js";
import FinanceCards from "../components/finance/FinanceCards";
import { input, button, primary } from "../components/finance/ui";

function MonthForm({ row, onSave, onClose }) {
  const [target, setTarget] = useState(
    row.target === null ? "" : String(row.target),
  );
  const [savings, setSavings] = useState(String(row.savings));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const values = {
      target: target === "" ? null : Number(target),
      savings: Number(savings || 0),
    };
    if (
      ![values.target, values.savings].every(
        (value) =>
          value === null || (Number.isSafeInteger(value) && value >= 0),
      )
    ) {
      setError("Nhập số nguyên không âm hợp lệ, đơn vị đồng.");
      return;
    }
    setSaving(true);
    try { await onSave(row.month, values); onClose(); }
    catch (reason) { setError(reason.message || "Chưa lưu được. Nội dung đang nhập được giữ nguyên."); }
    finally { setSaving(false); }
  };
  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-slate-900"
    >
      <h3 className="m-0 font-bold">Chỉnh tháng {row.month}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          Mục tiêu thu nhập (đồng)
          <input
            type="number"
            min="0"
            step="1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="VD: 10000000"
            className={input}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Tiền đã để riêng tiết kiệm (đồng)
          <input
            type="number"
            min="0"
            step="1"
            value={savings}
            onChange={(e) => setSavings(e.target.value)}
            disabled={row.future}
            className={input}
          />
        </label>
      </div>
      <p className="m-0 text-xs text-slate-600 dark:text-slate-400">
        Để trống mục tiêu nếu chưa đặt. Tiết kiệm là số ghi nhận riêng, không tự
        trừ thêm vào chi tiêu hoặc số dư.
      </p>
      {error && (
        <p role="alert" className="m-0 text-sm text-red-700 dark:text-rose-400">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className={primary}
        >
          {saving ? "Đang lưu…" : `Lưu tháng ${row.month}`}
        </button>
        <button
          type="button"
          onClick={onClose}
          className={button}
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

function YearContent({ transactions, userId, year }) {
  const { plan, error, loading, saveMonth } = useYearPlan(userId, year);
  const [editing, setEditing] = useState(null);
  const summary = buildYearSummary(transactions, year, plan);
  const cards = [
    { label: "Kế hoạch cả năm", value: summary.target, color: "blue" },
    { label: "Thực thu", value: summary.income, color: "green" },
    { label: "Chi tiêu", value: summary.expense, color: "red" },
    { label: "Tiết kiệm đã ghi nhận", value: summary.savings, color: "blue" },
    { label: "Tháng đạt mục tiêu", value: `${summary.reached} / ${summary.eligible}`, color: "amber" },
  ];
  return (
    <div className="grid gap-5">
      {error && (
        <p
          role="alert"
          className="m-0 rounded-xl bg-red-50 dark:bg-rose-950 p-4 text-sm text-red-700 dark:text-rose-400"
        >
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-slate-500">Đang tải kế hoạch năm từ Firebase…</p>}
      <FinanceCards items={cards} columns={5} />
      <p className="m-0 text-sm text-slate-600 dark:text-slate-400">
        Chênh lệch thu − chi:{" "}
        <strong
          className={
            summary.balance < 0
              ? "text-red-700 dark:text-rose-400"
              : "text-green-700 dark:text-emerald-400"
          }
        >
          {formatMoney(summary.balance)}
        </strong>
        . Số tháng đạt chỉ tính tháng đã đến kỳ và có mục tiêu lớn hơn 0.
      </p>
      {editing !== null && !loading && !error && (
        <MonthForm
          key={editing}
          row={summary.rows[editing - 1]}
          onSave={saveMonth}
          onClose={() => setEditing(null)}
        />
      )}
      <div className="max-w-full min-w-0 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full min-w-[980px] border-collapse text-sm tabular-nums">
          <caption className="p-4 text-left font-bold text-slate-800 dark:text-slate-200">
            Tổng kết 12 tháng · Đơn vị: đồng
          </caption>
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <tr>
              {[
                "Tháng",
                "Dự tính thu",
                "Thực thu",
                "Chi tiêu",
                "Tiết kiệm",
                "Chênh lệch",
                "Tiến độ",
                "",
              ].map((label, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-4 py-3 text-left whitespace-nowrap"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((row) => (
              <tr
                key={row.month}
                className={`border-t border-slate-100 dark:border-slate-800 ${row.future ? "bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-300"}`}
              >
                <th
                  scope="row"
                  className="px-4 py-4 text-left whitespace-nowrap"
                >
                  Tháng {row.month}
                </th>
                <td className="px-4 py-4 whitespace-nowrap">
                  {row.target === null ? "—" : formatMoney(row.target)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {row.future ? "—" : formatMoney(row.income)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {row.future ? "—" : formatMoney(row.expense)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {row.future ? "—" : formatMoney(row.savings)}
                </td>
                <td
                  className={`px-4 py-4 whitespace-nowrap ${row.balance < 0 ? "text-red-700 dark:text-rose-400" : ""}`}
                >
                  {row.future ? "—" : formatMoney(row.balance)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${row.reached ? "bg-green-100 dark:bg-emerald-950 text-green-800 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    aria-label={`Chỉnh tháng ${row.month}`}
                    onClick={() => setEditing(row.month)}
                    disabled={loading || Boolean(error)}
                    className={`${button} !min-h-9 !px-3 !py-1.5`}
                  >
                    Chỉnh
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-bold">
            <tr>
              {[
                "Tổng",
                formatMoney(summary.target),
                formatMoney(summary.income),
                formatMoney(summary.expense),
                formatMoney(summary.savings),
                formatMoney(summary.balance),
                `${summary.reached} tháng đạt`,
                "",
              ].map((value, i) => (
                <td key={i} className="px-4 py-4 whitespace-nowrap">
                  {value}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="m-0 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Thực thu và chi tiêu lấy từ giao dịch đã nhập đến hôm nay, không gồm
        giao dịch mang ngày tương lai. Kế hoạch và tiết kiệm được đồng bộ trên Firebase theo năm. Tiết kiệm chưa phải
        số dư của ví tiết kiệm.
      </p>
    </div>
  );
}

export default function YearSummaryPage({
  transactions = [],
  userId,
  year = new Date().getFullYear(),
}) {
  return (
    <section className="grid min-w-0 gap-6 text-slate-800 dark:text-slate-200">
      <YearContent
        key={`${userId || "local"}:${year}`}
        transactions={transactions}
        userId={userId}
        year={year}
      />
    </section>
  );
}
