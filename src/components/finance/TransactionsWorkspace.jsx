import TransactionsPage from "../../pages/TransactionsPage";
import { button, primary, muted } from "./ui";
import RecurringManager from "../recurring/RecurringManager";

/** One destination for both income and expense, using the existing ledger CRUD. */
export default function TransactionsWorkspace({ type, onTypeChange, month, rows, onEdit, onDelete, onSocialNavigate, recurringRules = [], recurringActions, onRecurringPayment, onCreateRecurring }) {
  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Chọn loại giao dịch" className="flex min-w-0 w-full gap-2 sm:w-auto">
          {[
            { value: "expense", label: "Khoản chi" },
            { value: "income", label: "Khoản thu" },
            { value: "recurring", label: "Định kỳ" },
          ].map((item) => (
            <button key={item.value} id={`transaction-tab-${item.value}`} type="button"
              role="tab" aria-selected={type === item.value}
              aria-controls="transaction-panel"
              onClick={() => onTypeChange(item.value)}
              className={`${type === item.value ? primary : button} flex-1 sm:flex-none sm:min-w-32`}>
              {item.label}
            </button>
          ))}
        </div>
        <p className={`${muted} text-xs`}>Dữ liệu theo tháng đang chọn · Có thể sửa/xóa từng giao dịch</p>
      </div>
      <div id="transaction-panel" role="tabpanel" aria-labelledby={`transaction-tab-${type}`} className="min-w-0">
        {type === "recurring" ? <RecurringManager month={month} rules={recurringRules} onSave={recurringActions.save}
          onRemove={recurringActions.remove} onToggle={recurringActions.toggle} onCreate={onCreateRecurring}
          busy={recurringActions.busy} error={recurringActions.error} />
          : <TransactionsPage key={`${type}:${month}`} type={type} rows={rows} onEdit={onEdit}
            onDelete={onDelete} onSocialNavigate={onSocialNavigate} onRecurringPayment={onRecurringPayment} />}
      </div>
    </div>
  );
}
