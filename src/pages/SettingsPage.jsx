import { useState } from "react";
import CategoryManager from "../components/settings/CategoryManager";
import MindxIncomePanel from "../components/settings/MindxIncomePanel";
import { panel, button, muted, primary } from "../components/finance/ui";
import { localDate } from "../utils/finance";
import { exportBackup, downloadJson } from "../firebase/backup";
import { downloadAnnualWorkbook } from "../utils/annualExcel";

export default function SettingsPage({ user, dark, onThemeChange, categoryConfig, onSaveCategories, usedCategoryIds = [], mindx, transactions = [] }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  async function backup(asExcel) {
    setBusy(true); setError(""); setMessage("");
    try {
      const data = await exportBackup(user.uid);
      if (asExcel) {
        downloadAnnualWorkbook(data, year, mindx?.rows || []);
        setMessage(`Đã tạo file Excel năm ${year}.`);
      } else {
        downloadJson(data, `zwhisflow-${localDate()}.json`);
        setMessage("Đã tạo bản sao lưu JSON đầy đủ từ Firebase.");
      }
    } catch (reason) {
      setError(reason?.message || "Không thể xuất dữ liệu.");
    } finally { setBusy(false); }
  }
  const currentPeriod = localDate().slice(0, 7);
  return <div className="grid gap-6">
    <section className={panel}>
      <h2 className="text-lg font-bold">Sao lưu & xuất dữ liệu</h2>
      <p className={`mt-2 ${muted}`}>Excel để lưu và phân tích theo năm; JSON để lưu toàn bộ dữ liệu gốc có thể phục hồi trong tương lai.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm font-semibold">Năm xuất Excel
          <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
            {Array.from({ length: 69 }, (_, i) => i + 2023).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button type="button" className={primary} disabled={busy} onClick={() => backup(true)}>{busy ? "Đang xuất…" : `↓ Xuất Excel ${year}`}</button>
        <button type="button" className={button} disabled={busy} onClick={() => backup(false)}>↓ Sao lưu JSON đầy đủ</button>
      </div>
      <p className={`mt-3 text-xs ${muted}`}>Excel gồm tổng hợp, giao dịch, Sổ mừng, ngân sách, kế hoạch, mục tiêu và bảng lương mindX (nếu đã kết nối). Số tiền là VND đầy đủ.</p>
    </section>
    {mindx && <MindxIncomePanel mindx={mindx} uid={user.uid} period={currentPeriod} transactions={transactions} categoryId={categoryConfig.income.find((item) => item.id === "mindx")?.id || "salary"} />}
    <CategoryManager initial={categoryConfig} onSave={onSaveCategories} usedCategoryIds={usedCategoryIds}/>
    <section className={panel}><h2 className="font-bold">Tài khoản & giao diện</h2><p className={`mt-3 break-all ${muted}`}>{user.email}</p><p className={`mt-1 text-xs ${muted}`}>UID: {user.uid}</p>
      <button type="button" className={`mt-4 ${button}`} onClick={onThemeChange}>Chuyển sang giao diện {dark ? "sáng" : "tối"}</button>
    </section>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{message}</p>}
  </div>;
}
