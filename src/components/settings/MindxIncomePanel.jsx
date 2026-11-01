import { useEffect, useState } from "react";
import { button, input, muted, panel, primary } from "../finance/ui";
import { formatMoney } from "../../utils/money";
import { localDate } from "../../utils/finance";
import { mindxIncomeRow, mindxPaymentId } from "../../integrations/mindx/periods";
import { recordSalaryPayment } from "../../integrations/mindx/recordSalaryPayment";

export default function MindxIncomePanel({ mindx, uid, period, transactions, categoryId = "mindx", compact = false, connectionOnly = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [amountText, setAmountText] = useState("");
  const [date, setDate] = useState(localDate);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const row = mindxIncomeRow(mindx.rows, period);
  const paymentId = mindx.account?.uid ? mindxPaymentId(mindx.account.uid, period) : null;
  const paid = transactions.find((item) => item.id === paymentId);
  useEffect(() => { setAmountText(row?.expectedIncome ? String(row.expectedIncome / 1000) : ""); setError(""); setNotice(""); }, [period, row?.expectedIncome]);
  async function act(fn) {
    setWorking(true); setError(""); setNotice("");
    try { await fn(); }
    catch (reason) { setError(reason?.message || "Không thực hiện được thao tác."); }
    finally { setWorking(false); }
  }
  return <section className={panel}>
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-lg font-bold">Thu nhập mindX</h2>
        <p className={`mt-1 ${muted}`}>Đồng bộ dự kiến từ Salary Tracker · Kỳ {period.slice(5)}/{period.slice(0, 4)}</p></div>
      {mindx.account ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">Đã kết nối</span> : null}
    </div>
    {!mindx.configured ? <p className={muted}>Chưa thiết lập các biến VITE_MINDX_FIREBASE_* trong cấu hình zWhisFlow. Xem hướng dẫn đi kèm bản vá.</p>
      : !mindx.account ? <form onSubmit={(event) => { event.preventDefault(); act(async () => { await mindx.connect(email, password); setPassword(""); }); }} className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">Email Salary Tracker<input className={input} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email đăng nhập mindX" /></label>
          <label className="grid gap-1 text-sm font-semibold">Mật khẩu Salary Tracker<input className={input} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" /></label>
          <div className="sm:col-span-2"><button className={primary} disabled={working || mindx.checkingAuth}>Kết nối Salary Tracker</button></div>
        </form> : <div className="grid gap-4">
          {!compact && <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="min-w-0 truncate text-slate-500 dark:text-slate-400">{mindx.account.email}</span><button type="button" className={`${button} !min-h-9 !px-3`} onClick={() => act(() => mindx.disconnect())}>Ngắt kết nối</button></div>}
          {connectionOnly ? <p className={`text-sm ${muted}`}>Đã kết nối Salary Tracker. Lương của từng kỳ được tự cập nhật trong Thu chi và Tổng kết theo tháng công việc phát sinh.</p>
          : mindx.loading ? <p className={muted}>Đang lấy bảng lương…</p> : row ? <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30"><p className="text-xs text-slate-500 dark:text-slate-400">Lương dự kiến</p><p className="mt-1 break-words text-base font-extrabold text-emerald-800 dark:text-emerald-300 sm:text-lg">{formatMoney(row.expectedIncome)}</p></div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs text-slate-500 dark:text-slate-400">Công việc xác nhận</p><p className="mt-1 break-words text-base font-extrabold sm:text-lg">{formatMoney(row.confirmedWork)}</p></div>
            </div>
            <p className={`text-xs ${muted}`}>“Công việc xác nhận” không có nghĩa đã nhận lương. Chỉ “Ghi đã nhận” mới cộng vào thực thu.</p>
            {paid ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">✓ Đã ghi nhận {formatMoney(paid.amount)} ngày {paid.date?.split("-").reverse().join("/")}. Muốn thay đổi, hãy sửa ở danh sách Khoản thu.</p> : row.expectedIncome > 0 ? <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end" onSubmit={(event) => { event.preventDefault(); act(async () => {
              const value = Number(amountText);
              if (!Number.isFinite(value) || !Number.isSafeInteger(Math.round(value * 1000)) || Math.abs(Math.round(value * 1000) - value * 1000) > 0.0001 || value <= 0) throw new Error("Nhập số tiền hợp lệ theo nghìn đồng.");
              await recordSalaryPayment({ uid, salaryUid: mindx.account.uid, period, row, amount: Math.round(value * 1000), date, categoryId, existing: transactions });
              setNotice("Đã ghi nhận thực thu cho kỳ lương này.");
            }); }}>
              <label className="grid gap-1 text-xs font-semibold">Số đã nhận (nghìn đồng)<input className={input} type="number" min="0.001" step="any" value={amountText} onChange={(e) => setAmountText(e.target.value)} required /></label>
              <label className="grid gap-1 text-xs font-semibold">Ngày nhận tiền<input type="date" className={input} required value={date} max={localDate()} onChange={(e) => setDate(e.target.value)} /></label>
              <button className={primary} disabled={working}>Ghi đã nhận</button>
            </form> : <p className={muted}>Chưa có khoản lương dự kiến trong kỳ này.</p>}
          </> : <p className={muted}>Chưa có bảng lương của kỳ này. Hãy mở Salary Tracker sau khi cài bộ xuất tự động để dữ liệu được đồng bộ.</p>}
        </div>}
    {mindx.error && <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-400">{mindx.error}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    {notice && <p role="status" className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{notice}</p>}
  </section>;
}
