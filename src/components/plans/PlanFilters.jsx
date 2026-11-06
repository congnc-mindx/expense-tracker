import SmartSelect from "../common/SmartSelect";
import MonthPicker from "../common/MonthPicker";
import YearPicker from "../common/YearPicker";
import { panel, input, muted } from "../finance/ui";

const statusOptions = [
  { value: "active", label: "Đang làm" },
  { value: "completed", label: "Hoàn thành" },
  { value: "all", label: "Tất cả trạng thái" },
];
const horizonOptions = [
  { value: "all", label: "Tất cả kế hoạch" },
  { value: "short", label: "Ngắn hạn" },
  { value: "long", label: "Dài hạn" },
];
const periodOptions = [
  { value: "all", label: "Mọi kỳ" },
  { value: "month", label: "Theo tháng" },
  { value: "year", label: "Theo năm" },
];

/** Shared finance controls keep filters small and consistent with the Debt page. */
export default function PlanFilters({
  query, onQueryChange, status, onStatusChange, horizon, onHorizonChange,
  periodScope, onPeriodScopeChange, periodMonth, onPeriodMonthChange,
  periodYear, onPeriodYearChange, resultCount,
}) {
  return (
    <section className={`${panel} !p-3 sm:!p-4`} aria-label="Bộ lọc kế hoạch">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)]">
        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
          Tìm kế hoạch
          <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Tên, nhóm, đầu việc…" className={`${input} !min-h-11 !text-sm placeholder:font-normal`} />
        </label>
        <div className="grid min-w-0 gap-1.5 text-sm font-semibold">
          <span>Trạng thái</span>
          <SmartSelect label="Lọc trạng thái kế hoạch" value={status} onChange={onStatusChange} options={statusOptions} />
        </div>
        <div className="grid min-w-0 gap-1.5 text-sm font-semibold">
          <span>Loại kế hoạch</span>
          <SmartSelect label="Lọc loại kế hoạch" value={horizon} onChange={onHorizonChange} options={horizonOptions} />
        </div>
        <div className="grid min-w-0 gap-1.5 text-sm font-semibold">
          <span>Thời gian</span>
          <SmartSelect label="Lọc thời gian kế hoạch" value={periodScope} onChange={onPeriodScopeChange} options={periodOptions} />
        </div>
      </div>
      {periodScope !== "all" && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#e5ede6] pt-3 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dự kiến hoàn thành:</span>
          <div className="w-full min-w-0 sm:w-[290px]">
            {periodScope === "month"
              ? <MonthPicker value={periodMonth} onChange={onPeriodMonthChange} className="w-full" />
              : <YearPicker value={periodYear} onChange={onPeriodYearChange} className="w-full" />}
          </div>
        </div>
      )}
      <p role="status" className={`mt-3 text-xs ${muted}`}>
        {resultCount} kế hoạch phù hợp
      </p>
    </section>
  );
}
