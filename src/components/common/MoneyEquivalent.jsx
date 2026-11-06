import { formatMoney } from "../../utils/money";
import { parseThousandsToVnd } from "../../utils/moneyInput";

/** Common live VND equivalent for fields whose input unit is thousands of đồng.
 * Keep conversion in one place: never multiply the displayed value on save.
 */
export default function MoneyEquivalent({ value, allowZero = true, className = "" }) {
  const raw = String(value ?? "").trim();
  const amount = raw ? parseThousandsToVnd(raw, { allowZero }) : null;
  const valid = amount === null || Number.isSafeInteger(amount);

  return (
    <span aria-live="polite" aria-atomic="true"
      className={`block min-h-4 text-xs font-normal ${valid ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"} ${className}`}>
      {valid ? <>Tương đương: <strong className="font-semibold tabular-nums">{amount === null ? "—" : formatMoney(amount)}</strong></> : "Số tiền chưa hợp lệ"}
    </span>
  );
}
