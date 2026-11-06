import { useState } from "react";
import useYearPlan from "../../hooks/useYearPlan";
import { buildYearSummary } from "../../utils/yearSummary";
import FinanceCards from "../finance/FinanceCards";
import { panel, primary, muted } from "../finance/ui";
import YearGoalsDialog from "../finance/YearGoalsDialog";
import YearPicker from "../common/YearPicker";

export default function YearGoalsSettingsPanel({ userId, transactions = [] }) {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [open, setOpen] = useState(false);
  const { plan, loading, error, saveGoals } = useYearPlan(userId, year);
  const summary = buildYearSummary(transactions, year, plan);
  const initialMonth = year === currentDate.getFullYear() ? currentDate.getMonth() + 1 : 1;

  return (
    <div className="grid gap-4">
      <section className={panel}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold">Mục tiêu năm</h2>
            <p className={`mt-1 max-w-3xl ${muted}`}>
              Thiết lập mục tiêu thu nhập và tiết kiệm theo từng tháng hoặc cho cả 12 tháng.
              Mục này dùng để cài đặt; phần Tổng kết chỉ dùng để theo dõi và phân tích.
            </p>
          </div>
          <div className="min-w-[250px] flex-1 sm:max-w-sm">
            <YearPicker value={year} onChange={setYear} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <FinanceCards
            compact
            columns={4}
            items={[
              { label: "Kế hoạch thu nhập", value: summary.target, color: "blue" },
              { label: "Mục tiêu tiết kiệm", value: summary.savingsTarget, color: "amber" },
              { label: "Đã tiết kiệm", value: summary.savings, color: "green" },
              { label: "Tháng đang có mục tiêu", value: `${summary.rows.filter((row) => row.target || row.savingsTarget).length} / 12`, color: "blue" },
            ]}
          />
          <button type="button" className={`${primary} xl:self-start`} onClick={() => setOpen(true)} disabled={loading || Boolean(error)}>
            {loading ? "Đang tải…" : "Thiết lập mục tiêu"}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
          <p>
            <strong className="text-slate-800 dark:text-slate-100">Gợi ý dùng:</strong> đặt mục tiêu chung cho cả năm trước,
            sau đó chỉnh riêng các tháng cần khác biệt. Số “Đã tiết kiệm” là dữ liệu thực tế, không tự thay đổi khi bạn cập nhật mục tiêu.
          </p>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </p>
      )}

      {open && !loading && !error && (
        <YearGoalsDialog
          key={`${year}-${initialMonth}`}
          year={year}
          rows={summary.rows}
          initialMonth={initialMonth}
          onSave={saveGoals}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
